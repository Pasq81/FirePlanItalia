
export interface AssetAllocation {
  stocks: number; // % Azionario (Tax 26%)
  bonds: number;  // % Obbligazionario White List (Tax 12.5%)
  // Il resto è liquidità/altro
}

export interface UserProfile {
  currentAge: number;
  retirementAge: number; // Età pensionamento INPS (es. 67)
  fireAge: number;       // Età desiderata smaltimento lavoro
  lifeExpectancy: number;
}

export interface OneTimeEvent {
  id: string;
  name: string;
  year: number;
  amount: number; // Positive for income, Negative for expense
  type: 'expense' | 'income';
}

export interface Financials {
  currentPortfolio: number;     // Patrimonio liquido investito
  
  currentPensionFund1: number;   // Montante Fondo Pensione 1 attuale
  currentPensionFund2: number;   // Montante Fondo Pensione 2 attuale
  
  monthlySavings: number;       // Risparmio mensile netto
  annualExpenses: number;       // Spese annuali desiderate in FIRE (escluso mutuo)
  
  pensionContribution1: number;  // Versamento annuo fondo pensione 1
  pensionContribution2: number;  // Versamento annuo fondo pensione 2
  
  inflation: number;            // Inflazione stimata (%)
  
  // Mutuo
  annualMortgage: number;       // Rata annuale mutuo (fissa)
  mortgageStartYear: number;    // Anno inizio
  mortgageEndYear: number;      // Anno fine

  // Eventi Straordinari
  oneTimeEvents: OneTimeEvent[];
}

export interface Returns {
  stockReturn: number;   // Rendimento lordo Azionario (%)
  bondReturn: number;    // Rendimento lordo Obbligazionario (%)
  pension1Return: number; // Rendimento lordo fondo pensione 1 (%)
  pension2Return: number; // Rendimento lordo fondo pensione 2 (%)
}

export interface ItalianTools {
  useNaspi: boolean;     // Usare NASpI dopo il licenziamento?
  naspiNetMonth: number; // Importo netto mensile iniziale NASpI
  useRita: boolean;      // Usare RITA come ponte (5/10 anni prima)
  estimatedInps: number; // Pensione INPS netta attesa a 67 anni
  pensionIndexationPercent: number; // % di adeguamento all'inflazione (es. 75%)
}

export interface SimulationYear {
  age: number;
  year: number;
  phase: 'accumulation' | 'naspi' | 'rita_bridge' | 'fire_withdraw' | 'pension';
  
  // Capitals (Start of Year)
  portfolioValue: number;
  pensionFund1Value: number;
  pensionFund2Value: number;
  
  // Cash Flow
  livingExpensesAdjusted: number; // Spese vita rivalutate
  mortgageExpense: number;        // Rata mutuo fissa
  totalExpenses: number;          // Somma delle due
  extraExpenses: number;          // Spese straordinarie (ristrutturazioni, auto, etc)
  
  // Incomes
  incomeNaspi: number;
  incomeRita: number;
  incomeInps: number;
  extraIncome: number;            // Entrate straordinarie
  
  // Withdrawals
  withdrawalPortfolioGross: number; // Quanto prelevo dal portafoglio (lordo tasse)
  withdrawalPortfolioNet: number;   // Quanto mi entra in tasca
  taxesPaid: number;
  
  // End State
  isFailed: boolean; // Se il capitale è andato a zero
}

export type WealthType = 'pension1' | 'pension2' | 'investment';

export interface WealthRecord {
  id: string;
  year: number;
  type: WealthType;
  amount: number;
  note?: string;
}

export interface ActualRecord {
  id: string;
  year: number;
  
  // Patrimoni (Snapshot fine anno)
  portfolioValue: number;
  pensionFund1Value: number;
  pensionFund2Value: number;
  totalWealth: number;

  // Flussi (Totali anno)
  annualExpenses: number;       // Spese effettive sostenute
  monthlySavings: number;       // Media risparmio mensile effettivo
  pensionContribution1: number; // Versato su FP1
  pensionContribution2: number; // Versato su FP2

  notes?: string;
}

// Dynamic Categories
export interface Category {
    id: string;
    label: string;
    type: 'income' | 'expense';
    color: string;
    isDefault?: boolean;
}

export type ExpenseDetails = Record<string, number>;
export type IncomeDetails = Record<string, number>;

export interface MonthlyRecord {
  id: string;
  year: number;
  month: number; // 1-12
  
  // Snapshot Assets Values (Mark to Market)
  stocksValue: number;     // Azioni Singole (Tax 26%)
  etfValue: number;        // ETF (Tax 26%)
  bondsValue: number;      // Obbligazioni White List (Tax 12.5%)
  liquidityValue: number;  // Conto Corrente / Contanti (No Tax / Tax su giacenza)
  cryptoValue: number;     // Criptovalute (Tax 26%)
  derivativesValue: number;// Derivati (Tax 26%)
  commoditiesValue: number;// Materie Prime (Tax 26%)
  
  pensionFund1Value: number;
  pensionFund2Value: number;
  
  // Monthly Flow (Budget)
  income: number;   // Entrate nette totali
  expenses: number; // Uscite totali
  savings: number;  // Risparmio effettivo (Income - Expenses)
  
  // Details (Keys match Category IDs)
  incomeDetails?: IncomeDetails;
  expenseDetails?: ExpenseDetails;

  // Monthly Investments (Cash Injected into Assets)
  investedStocks: number;
  investedEtf: number;
  investedBonds: number;
  investedLiquidity: number; // Nuova liquidità accantonata
  investedCrypto: number;
  investedDerivatives: number;
  investedCommodities: number;
  
  investedPension1: number;
  investedPension2: number;
  
  notes?: string;
}

export interface ChartDataPoint {
  eta: number;
  [key: string]: any;
}

export interface BackupData {
  profile: UserProfile;
  financials: Financials;
  allocation: AssetAllocation;
  returns: Returns;
  tools: ItalianTools;
  actualData: ActualRecord[];
  monthlyData: MonthlyRecord[];
  categories: Category[];
  date: string;
}
