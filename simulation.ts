
import type { UserProfile, Financials, AssetAllocation, Returns, ItalianTools, SimulationYear } from './types';

export const runSimulation = (
  profile: UserProfile,
  fin: Financials,
  allocation: AssetAllocation,
  ret: Returns,
  tools: ItalianTools
): SimulationYear[] => {
  const currentYear = new Date().getFullYear();
  const results: SimulationYear[] = [];

  let portfolio = fin.currentPortfolio;
  let pensionFund1 = fin.currentPensionFund1;
  let pensionFund2 = fin.currentPensionFund2;
  
  // Tassazione media ponderata sul portafoglio
  // Azioni 26%, Titoli Stato 12.5%
  const weightedTaxRate = ((allocation.stocks * 0.26) + (allocation.bonds * 0.125)) / 100;
  
  // Rendimento medio ponderato sul portafoglio
  const weightedPortfolioReturn = ((allocation.stocks * ret.stockReturn) + (allocation.bonds * ret.bondReturn)) / 100;

  const pensionTaxRate = 0.15; // Semplificazione (va da 15% a 9% in base anzianità)

  for (let age = profile.currentAge; age <= profile.lifeExpectancy; age++) {
    const yearIndex = age - profile.currentAge;
    const year = currentYear + yearIndex;
    
    // 1. Rivalutazione spese vita (inflazione piena)
    const expenseMultiplier = Math.pow(1 + fin.inflation / 100, yearIndex);
    const livingExpensesAdjusted = fin.annualExpenses * expenseMultiplier;

    // 2. Mutuo (Tasso fisso, non soggetto a inflazione)
    let mortgageExpense = 0;
    if (year >= fin.mortgageStartYear && year <= fin.mortgageEndYear) {
        mortgageExpense = fin.annualMortgage;
    }

    // 3. Eventi Straordinari
    let extraExpenses = 0;
    let extraIncome = 0;
    
    if (fin.oneTimeEvents) {
        fin.oneTimeEvents.forEach(event => {
            if (event.year === year) {
                if (event.type === 'expense') {
                    extraExpenses += Math.abs(event.amount);
                } else {
                    extraIncome += Math.abs(event.amount);
                }
            }
        });
    }

    // 4. Spese totali
    const totalExpenses = livingExpensesAdjusted + mortgageExpense + extraExpenses;


    let incomeNaspi = 0;
    let incomeRita = 0;
    let incomeInps = 0;
    let withdrawalPortfolioGross = 0;
    let withdrawalPortfolioNet = 0;
    let taxesPaid = 0;
    let phase: SimulationYear['phase'] = 'accumulation';

    // --- DETERMINAZIONE FASE ---
    if (age < profile.fireAge) {
      phase = 'accumulation';
    } else if (tools.useNaspi && age < profile.fireAge + 2) {
      phase = 'naspi';
    } else if (age >= profile.retirementAge) {
      phase = 'pension';
    } else if (tools.useRita && age >= (profile.retirementAge - 10)) { 
        // RITA disponibile fino a 10 anni prima se inoccupati da 24 mesi. 
        // Semplifichiamo assumendo attivazione RITA nel bridge
        phase = 'rita_bridge';
    } else {
      phase = 'fire_withdraw';
    }

    // Aggiungi Entrate Straordinarie al portafoglio subito (prima dei flussi)
    portfolio += extraIncome;

    // --- GESTIONE FLUSSI PER FASE ---

    if (phase === 'accumulation') {
      // Calcolo Gap per spese straordinarie durante accumulo:
      // Se ci sono spese extra, le pago dal portafoglio o dai risparmi
      // Logica semplice: le sottraggo al portafoglio come "prelievo" senza tasse (assumo spesa da liquidità)
      portfolio -= extraExpenses;

      // Crescita capitale usando rendimento ponderato
      portfolio = portfolio * (1 + weightedPortfolioReturn / 100) + (fin.monthlySavings * 12);
      
      // Crescita Fondi Pensione separata
      pensionFund1 = pensionFund1 * (1 + ret.pension1Return / 100) + fin.pensionContribution1;
      pensionFund2 = pensionFund2 * (1 + ret.pension2Return / 100) + fin.pensionContribution2;
    } 
    else {
      // FASE DI DECUMULO / FIRE
      
      // 1. Calcolo Redditi "Automatici"
      
      // NASpI
      if (phase === 'naspi') {
        // Logica NASpI semplificata: 
        // Anno 1: Piena (con decalage mensile 3% dopo 6° mese, circa 85% dell'annuale pieno)
        // Anno 2: Continua decalage. 
        // Simuliamo un forfait annuale basato sull'input mensile netto
        const fullAnnual = tools.naspiNetMonth * 12; 
        incomeNaspi = age === profile.fireAge ? fullAnnual * 0.9 : fullAnnual * 0.6; // Stima decalage
      }

      // INPS
      if (age >= profile.retirementAge) {
        // Logica pensione con perequazione parziale
        const yearsToRetirement = Math.max(0, profile.retirementAge - profile.currentAge);
        const pensionAtRetirementNominal = (tools.estimatedInps * 12) * Math.pow(1 + fin.inflation / 100, yearsToRetirement);
        
        const yearsSinceRetirement = age - profile.retirementAge;
        const effectivePensionInflation = (fin.inflation / 100) * (tools.pensionIndexationPercent / 100);
        
        incomeInps = pensionAtRetirementNominal * Math.pow(1 + effectivePensionInflation, yearsSinceRetirement);
      }

      // RITA (Ponte Fondo Pensione)
      // Sommiamo i due fondi per capire la disponibilità totale
      const totalPensionWealth = pensionFund1 + pensionFund2;

      if (phase === 'rita_bridge' && totalPensionWealth > 0) {
         const yearsToPension = Math.max(1, profile.retirementAge - age);
         
         // 1. Calcoliamo prelievo sostenibile LORDO totale
         const maxGrossAvailable = totalPensionWealth / yearsToPension;
         
         // 2. Calcoliamo il NETTO corrispondente
         const maxNetAvailable = maxGrossAvailable * (1 - pensionTaxRate);

         // 3. Quanto ci serve per coprire le spese?
         const neededNet = Math.max(0, totalExpenses - incomeNaspi - incomeInps);
         
         // 4. Preleviamo il minore tra necessario e disponibile (Netto)
         incomeRita = Math.min(maxNetAvailable, neededNet);
         
         // 5. Ricalcoliamo il lordo da sottrarre
         const grossWithdrawal = incomeRita / (1 - pensionTaxRate);

         // 6. Sottraiamo proporzionalmente dai due fondi
         if (totalPensionWealth > 0) {
            const ratio1 = pensionFund1 / totalPensionWealth;
            const ratio2 = pensionFund2 / totalPensionWealth;
            
            pensionFund1 -= grossWithdrawal * ratio1;
            pensionFund2 -= grossWithdrawal * ratio2;
         }

         taxesPaid += (grossWithdrawal - incomeRita);
      }

      // 2. Calcolo Gap da coprire col Portafoglio
      const incomeSoFar = incomeNaspi + incomeRita + incomeInps;
      const gap = Math.max(0, totalExpenses - incomeSoFar);

      if (gap > 0) {
        // Devo prelevare dal portafoglio
        const estimatedGainPortion = 0.5; 
        const effectiveTaxRate = weightedTaxRate * estimatedGainPortion;
        
        withdrawalPortfolioNet = gap;
        withdrawalPortfolioGross = gap / (1 - effectiveTaxRate);
        taxesPaid += (withdrawalPortfolioGross - withdrawalPortfolioNet);

        portfolio -= withdrawalPortfolioGross;
      }

      // Applica rendimenti ai capitali residui
      if (portfolio > 0) portfolio = portfolio * (1 + weightedPortfolioReturn / 100);
      
      // I Fondi Pensione continuano a generare interessi separatamente
      if (pensionFund1 > 0) pensionFund1 = pensionFund1 * (1 + ret.pension1Return / 100);
      if (pensionFund2 > 0) pensionFund2 = pensionFund2 * (1 + ret.pension2Return / 100);
    }

    // Check fallimento
    if (portfolio < 0) {
      portfolio = 0;
    }
    // Evitiamo numeri negativi sui fondi (es. arrotondamenti RITA)
    if (pensionFund1 < 0) pensionFund1 = 0;
    if (pensionFund2 < 0) pensionFund2 = 0;

    results.push({
      age,
      year,
      phase,
      portfolioValue: Math.max(0, portfolio),
      pensionFund1Value: Math.max(0, pensionFund1),
      pensionFund2Value: Math.max(0, pensionFund2),
      livingExpensesAdjusted,
      mortgageExpense,
      extraExpenses,
      totalExpenses: totalExpenses,
      incomeNaspi,
      incomeRita,
      incomeInps,
      extraIncome,
      withdrawalPortfolioGross,
      withdrawalPortfolioNet,
      taxesPaid,
      isFailed: portfolio <= 0 && (incomeNaspi + incomeRita + incomeInps) < totalExpenses
    });
  }

  return results;
};
