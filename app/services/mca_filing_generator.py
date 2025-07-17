"""
MCA Filing Generator Service
Automated generation of AOC-4 and MGT-7 forms with XML export capabilities
"""

import xml.etree.ElementTree as ET
from datetime import datetime, date
from typing import Dict, List, Optional, Any
import json
import logging
from decimal import Decimal
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class FilingType(Enum):
    AOC_4 = "AOC-4"
    MGT_7 = "MGT-7"

@dataclass
class CompanyInfo:
    cin: str
    company_name: str
    registration_number: str
    date_of_incorporation: date
    registered_address: str
    pin_code: str
    phone: str
    email: str
    website: Optional[str] = None
    authorized_capital: Decimal = Decimal('0')
    paid_up_capital: Decimal = Decimal('0')
    category: str = "Company limited by shares"
    sub_category: str = "Indian Non-Government Company"

@dataclass
class DirectorInfo:
    din: str
    name: str
    designation: str
    appointment_date: date
    nationality: str
    qualification: str
    experience: str
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    is_independent: bool = False
    is_woman_director: bool = False

@dataclass
class FinancialData:
    financial_year: str
    revenue: Decimal
    profit_before_tax: Decimal
    profit_after_tax: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    reserves_surplus: Decimal
    dividend_paid: Decimal
    retained_earnings: Decimal
    borrowings: Decimal
    investments: Decimal

@dataclass
class ShareholdingData:
    category: str
    no_of_shares: int
    percentage: Decimal
    voting_rights: Decimal
    change_during_year: int = 0

@dataclass
class SubsidiaryData:
    name: str
    cin: str
    holding_percentage: Decimal
    country: str
    turnover: Decimal
    net_worth: Decimal
    investment: Decimal

class MCAFilingGenerator:
    """Generator for MCA filing forms with XML export"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def generate_aoc4_form(self, 
                          company_info: CompanyInfo,
                          financial_data: FinancialData,
                          directors: List[DirectorInfo],
                          subsidiaries: List[SubsidiaryData] = None,
                          associates: List[SubsidiaryData] = None) -> Dict[str, Any]:
        """
        Generate AOC-4 (Annual Return) form data
        """
        
        try:
            aoc4_data = {
                "form_type": "AOC-4",
                "generated_on": datetime.now().isoformat(),
                "company_information": {
                    "cin": company_info.cin,
                    "company_name": company_info.company_name,
                    "registration_number": company_info.registration_number,
                    "date_of_incorporation": company_info.date_of_incorporation.isoformat(),
                    "registered_address": company_info.registered_address,
                    "pin_code": company_info.pin_code,
                    "phone": company_info.phone,
                    "email": company_info.email,
                    "website": company_info.website,
                    "authorized_capital": str(company_info.authorized_capital),
                    "paid_up_capital": str(company_info.paid_up_capital),
                    "category": company_info.category,
                    "sub_category": company_info.sub_category
                },
                "financial_information": {
                    "financial_year": financial_data.financial_year,
                    "revenue": str(financial_data.revenue),
                    "profit_before_tax": str(financial_data.profit_before_tax),
                    "profit_after_tax": str(financial_data.profit_after_tax),
                    "total_assets": str(financial_data.total_assets),
                    "total_liabilities": str(financial_data.total_liabilities),
                    "reserves_surplus": str(financial_data.reserves_surplus),
                    "dividend_paid": str(financial_data.dividend_paid),
                    "retained_earnings": str(financial_data.retained_earnings),
                    "borrowings": str(financial_data.borrowings),
                    "investments": str(financial_data.investments)
                },
                "directors_information": [
                    {
                        "din": director.din,
                        "name": director.name,
                        "designation": director.designation,
                        "appointment_date": director.appointment_date.isoformat(),
                        "nationality": director.nationality,
                        "qualification": director.qualification,
                        "experience": director.experience,
                        "pan": director.pan,
                        "is_independent": director.is_independent,
                        "is_woman_director": director.is_woman_director
                    }
                    for director in directors
                ],
                "subsidiaries": [
                    {
                        "name": sub.name,
                        "cin": sub.cin,
                        "holding_percentage": str(sub.holding_percentage),
                        "country": sub.country,
                        "turnover": str(sub.turnover),
                        "net_worth": str(sub.net_worth),
                        "investment": str(sub.investment)
                    }
                    for sub in (subsidiaries or [])
                ],
                "associates": [
                    {
                        "name": assoc.name,
                        "cin": assoc.cin,
                        "holding_percentage": str(assoc.holding_percentage),
                        "country": assoc.country,
                        "turnover": str(assoc.turnover),
                        "net_worth": str(assoc.net_worth),
                        "investment": str(assoc.investment)
                    }
                    for assoc in (associates or [])
                ]
            }
            
            self.logger.info(f"Generated AOC-4 form for {company_info.company_name}")
            return aoc4_data
            
        except Exception as e:
            self.logger.error(f"Error generating AOC-4 form: {str(e)}")
            raise

    def generate_mgt7_form(self,
                          company_info: CompanyInfo,
                          financial_data: FinancialData,
                          directors: List[DirectorInfo],
                          shareholding: List[ShareholdingData],
                          board_meetings: int,
                          agm_date: date) -> Dict[str, Any]:
        """
        Generate MGT-7 (Annual Return) form data
        """
        
        try:
            mgt7_data = {
                "form_type": "MGT-7",
                "generated_on": datetime.now().isoformat(),
                "company_information": {
                    "cin": company_info.cin,
                    "company_name": company_info.company_name,
                    "registration_number": company_info.registration_number,
                    "date_of_incorporation": company_info.date_of_incorporation.isoformat(),
                    "registered_address": company_info.registered_address,
                    "pin_code": company_info.pin_code,
                    "phone": company_info.phone,
                    "email": company_info.email,
                    "website": company_info.website,
                    "authorized_capital": str(company_info.authorized_capital),
                    "paid_up_capital": str(company_info.paid_up_capital),
                    "category": company_info.category,
                    "sub_category": company_info.sub_category
                },
                "principal_business_activities": {
                    "main_activity": "Financial Services",
                    "business_code": "64990",
                    "percentage_of_turnover": "100"
                },
                "particulars_of_holding": {
                    "holding_company": None,
                    "subsidiary_companies": [],
                    "associate_companies": []
                },
                "shareholding_pattern": [
                    {
                        "category": holding.category,
                        "no_of_shares": holding.no_of_shares,
                        "percentage": str(holding.percentage),
                        "voting_rights": str(holding.voting_rights),
                        "change_during_year": holding.change_during_year
                    }
                    for holding in shareholding
                ],
                "directors_and_kmp": [
                    {
                        "din": director.din,
                        "name": director.name,
                        "designation": director.designation,
                        "appointment_date": director.appointment_date.isoformat(),
                        "nationality": director.nationality,
                        "qualification": director.qualification,
                        "experience": director.experience,
                        "is_independent": director.is_independent,
                        "is_woman_director": director.is_woman_director
                    }
                    for director in directors
                ],
                "board_meetings": {
                    "total_meetings": board_meetings,
                    "financial_year": financial_data.financial_year
                },
                "general_meetings": {
                    "agm_date": agm_date.isoformat(),
                    "financial_year": financial_data.financial_year
                },
                "financial_summary": {
                    "financial_year": financial_data.financial_year,
                    "revenue": str(financial_data.revenue),
                    "profit_after_tax": str(financial_data.profit_after_tax),
                    "total_assets": str(financial_data.total_assets),
                    "net_worth": str(financial_data.total_assets - financial_data.total_liabilities)
                }
            }
            
            self.logger.info(f"Generated MGT-7 form for {company_info.company_name}")
            return mgt7_data
            
        except Exception as e:
            self.logger.error(f"Error generating MGT-7 form: {str(e)}")
            raise

    def export_to_xml(self, form_data: Dict[str, Any], filing_type: FilingType) -> str:
        """
        Export form data to XML format compatible with MCA portal
        """
        
        try:
            # Create root element based on filing type
            if filing_type == FilingType.AOC_4:
                root = ET.Element("AOC4Filing")
                root.set("version", "1.0")
                root.set("xmlns", "http://www.mca.gov.in/AOC4")
            else:  # MGT_7
                root = ET.Element("MGT7Filing")
                root.set("version", "1.0")
                root.set("xmlns", "http://www.mca.gov.in/MGT7")
            
            # Add filing metadata
            metadata = ET.SubElement(root, "FilingMetadata")
            ET.SubElement(metadata, "FormType").text = form_data["form_type"]
            ET.SubElement(metadata, "GeneratedOn").text = form_data["generated_on"]
            ET.SubElement(metadata, "FilingDate").text = datetime.now().strftime("%Y-%m-%d")
            
            # Add company information
            company_elem = ET.SubElement(root, "CompanyInformation")
            company_info = form_data["company_information"]
            
            for key, value in company_info.items():
                if value is not None:
                    ET.SubElement(company_elem, self._to_pascal_case(key)).text = str(value)
            
            # Add financial information
            financial_elem = ET.SubElement(root, "FinancialInformation")
            financial_info = form_data["financial_information"]
            
            for key, value in financial_info.items():
                if value is not None:
                    ET.SubElement(financial_elem, self._to_pascal_case(key)).text = str(value)
            
            # Add directors information
            directors_elem = ET.SubElement(root, "DirectorsInformation")
            for director in form_data["directors_information"]:
                director_elem = ET.SubElement(directors_elem, "Director")
                for key, value in director.items():
                    if value is not None:
                        ET.SubElement(director_elem, self._to_pascal_case(key)).text = str(value)
            
            # Add form-specific elements
            if filing_type == FilingType.AOC_4:
                # Add subsidiaries
                if form_data.get("subsidiaries"):
                    subsidiaries_elem = ET.SubElement(root, "Subsidiaries")
                    for subsidiary in form_data["subsidiaries"]:
                        sub_elem = ET.SubElement(subsidiaries_elem, "Subsidiary")
                        for key, value in subsidiary.items():
                            if value is not None:
                                ET.SubElement(sub_elem, self._to_pascal_case(key)).text = str(value)
                
                # Add associates
                if form_data.get("associates"):
                    associates_elem = ET.SubElement(root, "Associates")
                    for associate in form_data["associates"]:
                        assoc_elem = ET.SubElement(associates_elem, "Associate")
                        for key, value in associate.items():
                            if value is not None:
                                ET.SubElement(assoc_elem, self._to_pascal_case(key)).text = str(value)
            
            elif filing_type == FilingType.MGT_7:
                # Add shareholding pattern
                if form_data.get("shareholding_pattern"):
                    shareholding_elem = ET.SubElement(root, "ShareholdingPattern")
                    for holding in form_data["shareholding_pattern"]:
                        holding_elem = ET.SubElement(shareholding_elem, "Holding")
                        for key, value in holding.items():
                            if value is not None:
                                ET.SubElement(holding_elem, self._to_pascal_case(key)).text = str(value)
                
                # Add board meetings
                if form_data.get("board_meetings"):
                    meetings_elem = ET.SubElement(root, "BoardMeetings")
                    for key, value in form_data["board_meetings"].items():
                        if value is not None:
                            ET.SubElement(meetings_elem, self._to_pascal_case(key)).text = str(value)
                
                # Add general meetings
                if form_data.get("general_meetings"):
                    general_elem = ET.SubElement(root, "GeneralMeetings")
                    for key, value in form_data["general_meetings"].items():
                        if value is not None:
                            ET.SubElement(general_elem, self._to_pascal_case(key)).text = str(value)
            
            # Add digital signature placeholder
            signature_elem = ET.SubElement(root, "DigitalSignature")
            ET.SubElement(signature_elem, "SignedBy").text = "Company Secretary"
            ET.SubElement(signature_elem, "SignedOn").text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ET.SubElement(signature_elem, "CertificateSerialNumber").text = "PLACEHOLDER"
            
            # Format XML with proper indentation
            self._indent_xml(root)
            
            # Convert to string
            xml_string = ET.tostring(root, encoding='unicode', method='xml')
            xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
            
            self.logger.info(f"Exported {filing_type.value} form to XML")
            return xml_declaration + xml_string
            
        except Exception as e:
            self.logger.error(f"Error exporting to XML: {str(e)}")
            raise

    def validate_form_data(self, form_data: Dict[str, Any], filing_type: FilingType) -> List[str]:
        """
        Validate form data according to MCA requirements
        """
        
        errors = []
        
        try:
            # Common validations
            company_info = form_data.get("company_information", {})
            
            # Validate CIN
            cin = company_info.get("cin")
            if not cin or len(cin) != 21:
                errors.append("Invalid CIN format. Must be 21 characters.")
            
            # Validate company name
            if not company_info.get("company_name"):
                errors.append("Company name is required.")
            
            # Validate financial year
            financial_info = form_data.get("financial_information", {})
            fy = financial_info.get("financial_year")
            if not fy or not self._validate_financial_year(fy):
                errors.append("Invalid financial year format. Use YYYY-YY format.")
            
            # Validate directors
            directors = form_data.get("directors_information", [])
            if not directors:
                errors.append("At least one director is required.")
            
            for i, director in enumerate(directors):
                din = director.get("din")
                if not din or len(din) != 8:
                    errors.append(f"Director {i+1}: Invalid DIN format. Must be 8 digits.")
            
            # Form-specific validations
            if filing_type == FilingType.AOC_4:
                # Validate financial data completeness
                required_financial_fields = [
                    "revenue", "profit_before_tax", "profit_after_tax",
                    "total_assets", "total_liabilities"
                ]
                
                for field in required_financial_fields:
                    if field not in financial_info or financial_info[field] is None:
                        errors.append(f"AOC-4: {field} is required.")
            
            elif filing_type == FilingType.MGT_7:
                # Validate shareholding pattern
                shareholding = form_data.get("shareholding_pattern", [])
                if not shareholding:
                    errors.append("MGT-7: Shareholding pattern is required.")
                
                # Validate board meetings
                board_meetings = form_data.get("board_meetings", {})
                if not board_meetings.get("total_meetings"):
                    errors.append("MGT-7: Number of board meetings is required.")
            
            self.logger.info(f"Validation completed for {filing_type.value}: {len(errors)} errors found")
            return errors
            
        except Exception as e:
            self.logger.error(f"Error during validation: {str(e)}")
            return [f"Validation error: {str(e)}"]

    def generate_filing_checklist(self, filing_type: FilingType) -> List[str]:
        """
        Generate checklist for filing requirements
        """
        
        if filing_type == FilingType.AOC_4:
            return [
                "Board resolution for adoption of financial statements",
                "Audited financial statements",
                "Directors' report",
                "Auditor's report",
                "Details of subsidiary companies (if any)",
                "Details of associate companies (if any)",
                "Cash flow statement",
                "Notes to financial statements",
                "Digital signature certificate of Company Secretary",
                "Form fee payment"
            ]
        
        elif filing_type == FilingType.MGT_7:
            return [
                "Board resolution for filing annual return",
                "Copy of annual return",
                "Details of shareholding pattern",
                "Details of board meetings held",
                "Details of general meetings held",
                "List of directors and KMP",
                "Details of changes in directors during the year",
                "Details of remuneration paid to directors",
                "Digital signature certificate of Company Secretary",
                "Form fee payment"
            ]
        
        return []

    def _to_pascal_case(self, snake_str: str) -> str:
        """Convert snake_case to PascalCase"""
        components = snake_str.split('_')
        return ''.join(word.capitalize() for word in components)

    def _validate_financial_year(self, fy: str) -> bool:
        """Validate financial year format (YYYY-YY)"""
        try:
            parts = fy.split('-')
            if len(parts) != 2:
                return False
            
            start_year = int(parts[0])
            end_year = int(parts[1])
            
            # Check if it's consecutive years
            return (start_year + 1) % 100 == end_year
        except:
            return False

    def _indent_xml(self, elem, level=0):
        """Add proper indentation to XML"""
        i = "\n" + level * "  "
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = i + "  "
            if not elem.tail or not elem.tail.strip():
                elem.tail = i
            for child in elem:
                self._indent_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = i
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = i