"""
Financial reports service for generating statements
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import json

class FinancialReportsService:
    """Handle financial report generation"""
    
    def __init__(self):
        self.statement_types = {
            'trial_balance': 'Trial Balance',
            'profit_loss': 'Profit & Loss Statement',
            'balance_sheet': 'Balance Sheet',
            'cash_flow': 'Cash Flow Statement'
        }
        
        # Sample account structure
        self.chart_of_accounts = {
            'assets': {
                'current_assets': ['Cash', 'Bank', 'Accounts Receivable', 'Inventory'],
                'fixed_assets': ['Property', 'Equipment', 'Furniture', 'Vehicles']
            },
            'liabilities': {
                'current_liabilities': ['Accounts Payable', 'Accrued Expenses', 'Short-term Loans'],
                'long_term_liabilities': ['Long-term Loans', 'Bonds Payable']
            },
            'equity': ['Share Capital', 'Retained Earnings', 'Reserves'],
            'income': ['Sales Revenue', 'Service Revenue', 'Other Income'],
            'expenses': ['Cost of Goods Sold', 'Operating Expenses', 'Interest Expense', 'Tax Expense']
        }
    
    async def get_statements(self, user_id: str, period: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get financial statements for user"""
        statements = []
        
        # Generate sample statements
        for statement_type, statement_name in self.statement_types.items():
            statement_data = await self._generate_sample_statement(statement_type, period)
            
            statements.append({
                'id': f"{statement_type}_{user_id}_{period or 'current'}",
                'statement_type': statement_type,
                'statement_name': statement_name,
                'period': period or self._get_current_period(),
                'data': statement_data,
                'generated_at': datetime.utcnow().isoformat()
            })
        
        return statements
    
    async def generate_statement(self, user_id: str, period: str, statement_type: str) -> Dict[str, Any]:
        """Generate specific financial statement"""
        
        if statement_type not in self.statement_types:
            raise ValueError(f"Invalid statement type: {statement_type}")
        
        statement_data = await self._generate_sample_statement(statement_type, period)
        
        return {
            'id': f"{statement_type}_{user_id}_{period}",
            'statement_type': statement_type,
            'statement_name': self.statement_types[statement_type],
            'period': period,
            'data': statement_data,
            'generated_at': datetime.utcnow().isoformat(),
            'user_id': user_id
        }
    
    async def _generate_sample_statement(self, statement_type: str, period: Optional[str]) -> Dict[str, Any]:
        """Generate sample statement data"""
        
        if statement_type == 'trial_balance':
            return self._generate_trial_balance(period)
        elif statement_type == 'profit_loss':
            return self._generate_profit_loss(period)
        elif statement_type == 'balance_sheet':
            return self._generate_balance_sheet(period)
        elif statement_type == 'cash_flow':
            return self._generate_cash_flow(period)
        
        return {}
    
    def _generate_trial_balance(self, period: Optional[str]) -> Dict[str, Any]:
        """Generate trial balance"""
        accounts = [
            {'account_code': '1001', 'account_name': 'Cash', 'debit': 150000, 'credit': 0},
            {'account_code': '1002', 'account_name': 'Bank', 'debit': 500000, 'credit': 0},
            {'account_code': '1100', 'account_name': 'Accounts Receivable', 'debit': 200000, 'credit': 0},
            {'account_code': '1200', 'account_name': 'Inventory', 'debit': 300000, 'credit': 0},
            {'account_code': '1500', 'account_name': 'Equipment', 'debit': 800000, 'credit': 0},
            {'account_code': '2001', 'account_name': 'Accounts Payable', 'debit': 0, 'credit': 150000},
            {'account_code': '2100', 'account_name': 'Accrued Expenses', 'debit': 0, 'credit': 75000},
            {'account_code': '3001', 'account_name': 'Share Capital', 'debit': 0, 'credit': 500000},
            {'account_code': '3100', 'account_name': 'Retained Earnings', 'debit': 0, 'credit': 625000},
            {'account_code': '4001', 'account_name': 'Sales Revenue', 'debit': 0, 'credit': 1200000},
            {'account_code': '5001', 'account_name': 'Cost of Goods Sold', 'debit': 600000, 'credit': 0},
            {'account_code': '5100', 'account_name': 'Operating Expenses', 'debit': 400000, 'credit': 0},
        ]
        
        total_debit = sum(acc['debit'] for acc in accounts)
        total_credit = sum(acc['credit'] for acc in accounts)
        
        return {
            'period': period or self._get_current_period(),
            'accounts': accounts,
            'totals': {
                'total_debit': total_debit,
                'total_credit': total_credit,
                'balanced': total_debit == total_credit
            },
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _generate_profit_loss(self, period: Optional[str]) -> Dict[str, Any]:
        """Generate profit & loss statement"""
        
        revenue = {
            'sales_revenue': 1200000,
            'service_revenue': 300000,
            'other_income': 50000
        }
        
        expenses = {
            'cost_of_goods_sold': 600000,
            'operating_expenses': 400000,
            'depreciation': 50000,
            'interest_expense': 25000,
            'tax_expense': 75000
        }
        
        total_revenue = sum(revenue.values())
        total_expenses = sum(expenses.values())
        net_income = total_revenue - total_expenses
        
        return {
            'period': period or self._get_current_period(),
            'revenue': revenue,
            'total_revenue': total_revenue,
            'expenses': expenses,
            'total_expenses': total_expenses,
            'gross_profit': revenue['sales_revenue'] - expenses['cost_of_goods_sold'],
            'operating_profit': total_revenue - expenses['operating_expenses'] - expenses['cost_of_goods_sold'],
            'net_income': net_income,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _generate_balance_sheet(self, period: Optional[str]) -> Dict[str, Any]:
        """Generate balance sheet"""
        
        assets = {
            'current_assets': {
                'cash': 150000,
                'bank': 500000,
                'accounts_receivable': 200000,
                'inventory': 300000
            },
            'fixed_assets': {
                'equipment': 800000,
                'furniture': 100000,
                'vehicles': 200000,
                'accumulated_depreciation': -150000
            }
        }
        
        liabilities = {
            'current_liabilities': {
                'accounts_payable': 150000,
                'accrued_expenses': 75000,
                'short_term_loans': 100000
            },
            'long_term_liabilities': {
                'long_term_loans': 300000,
                'bonds_payable': 200000
            }
        }
        
        equity = {
            'share_capital': 500000,
            'retained_earnings': 625000,
            'reserves': 100000
        }
        
        total_current_assets = sum(assets['current_assets'].values())
        total_fixed_assets = sum(assets['fixed_assets'].values())
        total_assets = total_current_assets + total_fixed_assets
        
        total_current_liabilities = sum(liabilities['current_liabilities'].values())
        total_long_term_liabilities = sum(liabilities['long_term_liabilities'].values())
        total_liabilities = total_current_liabilities + total_long_term_liabilities
        
        total_equity = sum(equity.values())
        
        return {
            'period': period or self._get_current_period(),
            'assets': assets,
            'liabilities': liabilities,
            'equity': equity,
            'totals': {
                'total_assets': total_assets,
                'total_liabilities': total_liabilities,
                'total_equity': total_equity,
                'balanced': total_assets == (total_liabilities + total_equity)
            },
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _generate_cash_flow(self, period: Optional[str]) -> Dict[str, Any]:
        """Generate cash flow statement"""
        
        operating_activities = {
            'net_income': 200000,
            'depreciation': 50000,
            'accounts_receivable_change': -25000,
            'inventory_change': -30000,
            'accounts_payable_change': 15000
        }
        
        investing_activities = {
            'equipment_purchase': -100000,
            'investment_sale': 50000
        }
        
        financing_activities = {
            'loan_proceeds': 150000,
            'loan_repayment': -50000,
            'dividends_paid': -75000
        }
        
        net_operating_cash = sum(operating_activities.values())
        net_investing_cash = sum(investing_activities.values())
        net_financing_cash = sum(financing_activities.values())
        
        net_cash_flow = net_operating_cash + net_investing_cash + net_financing_cash
        
        return {
            'period': period or self._get_current_period(),
            'operating_activities': operating_activities,
            'investing_activities': investing_activities,
            'financing_activities': financing_activities,
            'net_cash_flows': {
                'operating': net_operating_cash,
                'investing': net_investing_cash,
                'financing': net_financing_cash,
                'total': net_cash_flow
            },
            'beginning_cash': 400000,
            'ending_cash': 400000 + net_cash_flow,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _get_current_period(self) -> str:
        """Get current financial period"""
        now = datetime.now()
        if now.month <= 3:
            return f"Q4_{now.year - 1}"
        elif now.month <= 6:
            return f"Q1_{now.year}"
        elif now.month <= 9:
            return f"Q2_{now.year}"
        else:
            return f"Q3_{now.year}"
    
    async def export_statement(self, statement_id: str, format: str = 'json') -> Dict[str, Any]:
        """Export statement in specified format"""
        # This would typically retrieve the statement from database
        # and format it according to the requested format
        
        return {
            'statement_id': statement_id,
            'format': format,
            'export_url': f"/api/exports/{statement_id}.{format}",
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def generate_trial_balance(self, period: str) -> Dict[str, Any]:
        """Generate trial balance for a specific period"""
        return self._generate_trial_balance(period)