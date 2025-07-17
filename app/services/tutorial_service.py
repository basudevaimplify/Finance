"""
Tutorial Service - Provides contextual guidance and tutorials
"""

from typing import Dict, List, Any, Optional
from datetime import datetime

class TutorialService:
    """Service for providing contextual tutorials and guidance"""
    
    def __init__(self):
        self.tutorials = {
            'gst_compliance': {
                'title': 'GST Compliance Guide',
                'description': 'Step-by-step guide for GST compliance',
                'steps': [
                    'Register for GST if turnover exceeds threshold',
                    'Collect and maintain proper invoices',
                    'File monthly/quarterly returns',
                    'Pay taxes on time'
                ]
            },
            'tds_compliance': {
                'title': 'TDS Compliance Guide',
                'description': 'Complete guide for TDS compliance',
                'steps': [
                    'Obtain TAN (Tax Deduction Account Number)',
                    'Deduct TDS as per applicable rates',
                    'File quarterly TDS returns',
                    'Issue TDS certificates'
                ]
            },
            'document_upload': {
                'title': 'Document Upload Guide',
                'description': 'How to upload and process documents',
                'steps': [
                    'Select supported file formats (PDF, Excel, CSV)',
                    'Ensure file size is under 100MB',
                    'Upload files through the interface',
                    'Review extracted data for accuracy'
                ]
            }
        }
    
    def get_tutorial(self, tutorial_id: str) -> Dict[str, Any]:
        """Get specific tutorial by ID"""
        
        if tutorial_id not in self.tutorials:
            raise ValueError(f"Tutorial not found: {tutorial_id}")
        
        tutorial = self.tutorials[tutorial_id].copy()
        tutorial['id'] = tutorial_id
        tutorial['retrieved_at'] = datetime.utcnow().isoformat()
        
        return tutorial
    
    def get_all_tutorials(self) -> List[Dict[str, Any]]:
        """Get all available tutorials"""
        
        tutorials = []
        for tutorial_id, tutorial_data in self.tutorials.items():
            tutorial = tutorial_data.copy()
            tutorial['id'] = tutorial_id
            tutorials.append(tutorial)
        
        return tutorials
    
    def get_contextual_help(self, context: str) -> Dict[str, Any]:
        """Get contextual help based on current context"""
        
        help_mapping = {
            'document_upload': 'document_upload',
            'gst': 'gst_compliance',
            'tds': 'tds_compliance'
        }
        
        tutorial_id = help_mapping.get(context, 'document_upload')
        return self.get_tutorial(tutorial_id)