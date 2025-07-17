"""
API endpoints for Data Source Configuration
Provides RESTful endpoints for managing data sources
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import io

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.data_source_service import (
    DataSourceService, DataSourceConfig, DataSourceType, 
    DatabaseType, ConnectionStatus
)

router = APIRouter(prefix="/api/data-sources", tags=["data-sources"])

# Initialize service
data_source_service = DataSourceService()

@router.get("/")
async def get_data_sources(
    source_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all data sources or filter by type"""
    try:
        if source_type:
            try:
                ds_type = DataSourceType(source_type)
                sources = data_source_service.get_data_sources_by_type(ds_type)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid data source type: {source_type}"
                )
        else:
            sources = data_source_service.get_all_data_sources()
        
        return {
            "success": True,
            "data_sources": [
                {
                    "id": source.id,
                    "name": source.name,
                    "type": source.type.value,
                    "description": source.description,
                    "is_active": source.is_active,
                    "is_default": source.is_default,
                    "status": source.status.value,
                    "last_tested": source.last_tested.isoformat() if source.last_tested else None,
                    "error_message": source.error_message,
                    "created_at": source.created_at.isoformat(),
                    "updated_at": source.updated_at.isoformat()
                }
                for source in sources
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data sources: {str(e)}"
        )

@router.get("/{source_id}")
async def get_data_source(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific data source by ID"""
    source = data_source_service.get_data_source(source_id)
    
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Don't expose sensitive information
    config = source.config.copy()
    if "password" in config:
        config["password"] = "***REDACTED***"
    if "api_key" in config:
        config["api_key"] = "***REDACTED***"
    
    return {
        "success": True,
        "data_source": {
            "id": source.id,
            "name": source.name,
            "type": source.type.value,
            "description": source.description,
            "config": config,
            "is_active": source.is_active,
            "is_default": source.is_default,
            "status": source.status.value,
            "last_tested": source.last_tested.isoformat() if source.last_tested else None,
            "error_message": source.error_message,
            "metadata": source.metadata,
            "created_at": source.created_at.isoformat(),
            "updated_at": source.updated_at.isoformat()
        }
    }

@router.post("/")
async def create_data_source(
    source_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create a new data source"""
    try:
        # Validate required fields
        required_fields = ["id", "name", "type", "description", "config"]
        for field in required_fields:
            if field not in source_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        # Validate type
        try:
            source_type = DataSourceType(source_data["type"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid data source type: {source_data['type']}"
            )
        
        # Create data source config
        config = DataSourceConfig(
            id=source_data["id"],
            name=source_data["name"],
            type=source_type,
            description=source_data["description"],
            config=source_data["config"],
            is_active=source_data.get("is_active", True),
            is_default=source_data.get("is_default", False),
            metadata=source_data.get("metadata", {})
        )
        
        # Check if ID already exists
        if data_source_service.get_data_source(config.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Data source with this ID already exists"
            )
        
        success = data_source_service.add_data_source(config)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create data source"
            )
        
        return {
            "success": True,
            "message": "Data source created successfully",
            "data_source_id": config.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create data source: {str(e)}"
        )

@router.put("/{source_id}")
async def update_data_source(
    source_id: str,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update an existing data source"""
    try:
        # Check if data source exists
        if not data_source_service.get_data_source(source_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        # Validate type if provided
        if "type" in updates:
            try:
                DataSourceType(updates["type"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid data source type: {updates['type']}"
                )
        
        success = data_source_service.update_data_source(source_id, updates)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update data source"
            )
        
        return {
            "success": True,
            "message": "Data source updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update data source: {str(e)}"
        )

@router.delete("/{source_id}")
async def delete_data_source(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a data source"""
    try:
        # Check if data source exists
        source = data_source_service.get_data_source(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        # Prevent deletion of default data sources
        if source.is_default:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete default data source"
            )
        
        success = data_source_service.remove_data_source(source_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete data source"
            )
        
        return {
            "success": True,
            "message": "Data source deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete data source: {str(e)}"
        )

@router.post("/{source_id}/test")
async def test_data_source_connection(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Test connection to a data source"""
    try:
        # Check if data source exists
        if not data_source_service.get_data_source(source_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        success = data_source_service.test_connection(source_id)
        source = data_source_service.get_data_source(source_id)
        
        return {
            "success": success,
            "status": source.status.value,
            "error_message": source.error_message,
            "last_tested": source.last_tested.isoformat() if source.last_tested else None,
            "message": "Connection successful" if success else "Connection failed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}"
        )

@router.post("/{source_id}/connect")
async def connect_to_data_source(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Connect to a data source"""
    try:
        # Check if data source exists
        if not data_source_service.get_data_source(source_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        success = data_source_service.connect_data_source(source_id)
        
        return {
            "success": success,
            "message": "Connected successfully" if success else "Connection failed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect: {str(e)}"
        )

@router.post("/{source_id}/disconnect")
async def disconnect_from_data_source(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Disconnect from a data source"""
    try:
        success = data_source_service.disconnect_data_source(source_id)
        
        return {
            "success": success,
            "message": "Disconnected successfully" if success else "Disconnection failed"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect: {str(e)}"
        )

@router.post("/{source_id}/query")
async def execute_database_query(
    source_id: str,
    query_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Execute a query on a database data source"""
    try:
        # Check if data source exists and is a database
        source = data_source_service.get_data_source(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        if source.type != DataSourceType.DATABASE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data source is not a database"
            )
        
        query = query_data.get("query")
        if not query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query is required"
            )
        
        # Execute query
        result = data_source_service.execute_query(source_id, query)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Query execution failed"
            )
        
        return {
            "success": True,
            "data": result.to_dict("records"),
            "row_count": len(result),
            "columns": result.columns.tolist()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute query: {str(e)}"
        )

@router.post("/{source_id}/api-request")
async def make_api_request(
    source_id: str,
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Make an API request to a configured API data source"""
    try:
        # Check if data source exists and is an API
        source = data_source_service.get_data_source(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        if source.type not in [DataSourceType.API, DataSourceType.GST_PORTAL, DataSourceType.MCA_PORTAL]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data source is not an API"
            )
        
        endpoint = request_data.get("endpoint")
        if not endpoint:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Endpoint is required"
            )
        
        method = request_data.get("method", "GET")
        data = request_data.get("data")
        
        # Make API request
        result = data_source_service.make_api_request(source_id, endpoint, method, data)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="API request failed"
            )
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to make API request: {str(e)}"
        )

@router.get("/{source_id}/stats")
async def get_data_source_statistics(
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get statistics for a data source"""
    try:
        # Check if data source exists
        if not data_source_service.get_data_source(source_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        stats = data_source_service.get_data_source_statistics(source_id)
        
        return {
            "success": True,
            "statistics": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.get("/types/available")
async def get_available_data_source_types(
    current_user: User = Depends(get_current_user)
):
    """Get available data source types"""
    types = []
    
    for ds_type in DataSourceType:
        type_info = {
            "value": ds_type.value,
            "name": ds_type.value.replace("_", " ").title(),
            "description": _get_type_description(ds_type)
        }
        types.append(type_info)
    
    return {
        "success": True,
        "types": types
    }

@router.get("/databases/types")
async def get_available_database_types(
    current_user: User = Depends(get_current_user)
):
    """Get available database types"""
    types = []
    
    for db_type in DatabaseType:
        type_info = {
            "value": db_type.value,
            "name": db_type.value.replace("_", " ").title(),
            "default_port": _get_default_port(db_type)
        }
        types.append(type_info)
    
    return {
        "success": True,
        "database_types": types
    }

@router.post("/export")
async def export_data_source_configurations(
    current_user: User = Depends(get_current_user)
):
    """Export all data source configurations"""
    try:
        export_data = data_source_service.export_configurations()
        
        return {
            "success": True,
            "export_data": export_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export configurations: {str(e)}"
        )

@router.post("/import")
async def import_data_source_configurations(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import data source configurations from file"""
    try:
        # Read file content
        content = await file.read()
        
        # Parse JSON
        import_data = json.loads(content.decode('utf-8'))
        
        # Import configurations
        success = data_source_service.import_configurations(import_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to import configurations"
            )
        
        return {
            "success": True,
            "message": "Configurations imported successfully"
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import configurations: {str(e)}"
        )

# Helper functions
def _get_type_description(ds_type: DataSourceType) -> str:
    descriptions = {
        DataSourceType.DATABASE: "SQL databases like PostgreSQL, MySQL, SQLite",
        DataSourceType.API: "REST APIs and web services",
        DataSourceType.FILE_SYSTEM: "Local or network file systems",
        DataSourceType.FTP: "FTP servers for file transfer",
        DataSourceType.SFTP: "Secure FTP servers",
        DataSourceType.EMAIL: "Email servers for notifications",
        DataSourceType.CLOUD_STORAGE: "Cloud storage services like AWS S3",
        DataSourceType.ERP_SYSTEM: "Enterprise resource planning systems",
        DataSourceType.BANKING_API: "Banking and financial APIs",
        DataSourceType.GST_PORTAL: "Government GST portal API",
        DataSourceType.MCA_PORTAL: "Ministry of Corporate Affairs portal API"
    }
    return descriptions.get(ds_type, "Custom data source")

def _get_default_port(db_type: DatabaseType) -> int:
    ports = {
        DatabaseType.POSTGRESQL: 5432,
        DatabaseType.MYSQL: 3306,
        DatabaseType.SQLITE: 0,  # File-based
        DatabaseType.ORACLE: 1521,
        DatabaseType.SQL_SERVER: 1433,
        DatabaseType.MONGODB: 27017
    }
    return ports.get(db_type, 0)