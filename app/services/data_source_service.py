"""
Data Source Configuration Service
Manages multiple data sources including databases, APIs, file systems, and external services
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum
import json
import os
from dataclasses import dataclass, asdict
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import requests
import pandas as pd
from pathlib import Path
import ftplib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class DataSourceType(Enum):
    DATABASE = "database"
    API = "api"
    FILE_SYSTEM = "file_system"
    FTP = "ftp"
    SFTP = "sftp"
    EMAIL = "email"
    CLOUD_STORAGE = "cloud_storage"
    ERP_SYSTEM = "erp_system"
    BANKING_API = "banking_api"
    GST_PORTAL = "gst_portal"
    MCA_PORTAL = "mca_portal"

class DatabaseType(Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"
    ORACLE = "oracle"
    SQL_SERVER = "sql_server"
    MONGODB = "mongodb"

class ConnectionStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    TESTING = "testing"

@dataclass
class DataSourceConfig:
    id: str
    name: str
    type: DataSourceType
    description: str
    config: Dict[str, Any]
    is_active: bool = True
    is_default: bool = False
    created_at: datetime = None
    updated_at: datetime = None
    last_tested: datetime = None
    status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    error_message: str = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

@dataclass
class DatabaseConfig:
    host: str
    port: int
    database: str
    username: str
    password: str
    database_type: DatabaseType
    ssl_mode: str = "prefer"
    schema: str = "public"
    connection_timeout: int = 30
    pool_size: int = 10

@dataclass
class APIConfig:
    base_url: str
    api_key: str = None
    auth_type: str = "api_key"  # api_key, bearer, basic, oauth
    headers: Dict[str, str] = None
    timeout: int = 30
    rate_limit: int = 100
    retry_count: int = 3

@dataclass
class FileSystemConfig:
    base_path: str
    access_mode: str = "read_write"  # read_only, read_write
    file_extensions: List[str] = None
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    encoding: str = "utf-8"

@dataclass
class FTPConfig:
    host: str
    username: str
    password: str
    port: int = 21
    passive_mode: bool = True
    timeout: int = 30

@dataclass
class EmailConfig:
    smtp_server: str
    username: str
    password: str
    smtp_port: int = 587
    use_tls: bool = True
    from_email: str = None

class DataSourceService:
    def __init__(self):
        self.data_sources: Dict[str, DataSourceConfig] = {}
        self.active_connections: Dict[str, Any] = {}
        self.load_default_configurations()
    
    def load_default_configurations(self):
        """Load default data source configurations"""
        default_configs = [
            {
                "id": "primary_db",
                "name": "Primary Database",
                "type": DataSourceType.DATABASE,
                "description": "Main PostgreSQL database for QRT platform",
                "config": {
                    "host": os.getenv("PGHOST", "localhost"),
                    "port": int(os.getenv("PGPORT", "5432")),
                    "database": os.getenv("PGDATABASE", "qrt_closure"),
                    "username": os.getenv("PGUSER", "postgres"),
                    "password": os.getenv("PGPASSWORD", ""),
                    "database_type": DatabaseType.POSTGRESQL.value,
                    "ssl_mode": "prefer",
                    "schema": "public"
                },
                "is_default": True
            },
            {
                "id": "file_uploads",
                "name": "File Upload Storage",
                "type": DataSourceType.FILE_SYSTEM,
                "description": "Local file system for document uploads",
                "config": {
                    "base_path": "./uploads",
                    "access_mode": "read_write",
                    "file_extensions": [".pdf", ".xlsx", ".csv", ".docx"],
                    "max_file_size": 100 * 1024 * 1024,
                    "encoding": "utf-8"
                },
                "is_default": True
            },
            {
                "id": "gst_portal_api",
                "name": "GST Portal API",
                "type": DataSourceType.GST_PORTAL,
                "description": "Government GST portal API integration",
                "config": {
                    "base_url": "https://api.gst.gov.in",
                    "api_key": os.getenv("GST_API_KEY", ""),
                    "auth_type": "api_key",
                    "headers": {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    "timeout": 30,
                    "rate_limit": 100
                },
                "is_active": bool(os.getenv("GST_API_KEY"))
            },
            {
                "id": "mca_portal_api",
                "name": "MCA Portal API",
                "type": DataSourceType.MCA_PORTAL,
                "description": "Ministry of Corporate Affairs portal API",
                "config": {
                    "base_url": "https://www.mca.gov.in/mcafoportal",
                    "api_key": os.getenv("MCA_API_KEY", ""),
                    "auth_type": "api_key",
                    "headers": {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    "timeout": 60,
                    "rate_limit": 50
                },
                "is_active": bool(os.getenv("MCA_API_KEY"))
            }
        ]
        
        for config_dict in default_configs:
            config = DataSourceConfig(**config_dict)
            self.data_sources[config.id] = config
    
    def add_data_source(self, config: DataSourceConfig) -> bool:
        """Add a new data source configuration"""
        try:
            config.updated_at = datetime.now()
            self.data_sources[config.id] = config
            return True
        except Exception as e:
            print(f"Error adding data source: {str(e)}")
            return False
    
    def update_data_source(self, source_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing data source configuration"""
        if source_id not in self.data_sources:
            return False
        
        try:
            source = self.data_sources[source_id]
            for key, value in updates.items():
                if hasattr(source, key):
                    setattr(source, key, value)
            
            source.updated_at = datetime.now()
            return True
        except Exception as e:
            print(f"Error updating data source: {str(e)}")
            return False
    
    def remove_data_source(self, source_id: str) -> bool:
        """Remove a data source configuration"""
        if source_id in self.data_sources:
            # Close any active connections
            if source_id in self.active_connections:
                self.disconnect_data_source(source_id)
            
            del self.data_sources[source_id]
            return True
        return False
    
    def get_data_source(self, source_id: str) -> Optional[DataSourceConfig]:
        """Get a specific data source configuration"""
        return self.data_sources.get(source_id)
    
    def get_all_data_sources(self) -> List[DataSourceConfig]:
        """Get all data source configurations"""
        return list(self.data_sources.values())
    
    def get_data_sources_by_type(self, source_type: DataSourceType) -> List[DataSourceConfig]:
        """Get data sources by type"""
        return [ds for ds in self.data_sources.values() if ds.type == source_type]
    
    def test_connection(self, source_id: str) -> bool:
        """Test connection to a data source"""
        if source_id not in self.data_sources:
            return False
        
        source = self.data_sources[source_id]
        source.status = ConnectionStatus.TESTING
        source.last_tested = datetime.now()
        
        try:
            success = self._test_connection_by_type(source)
            source.status = ConnectionStatus.CONNECTED if success else ConnectionStatus.ERROR
            source.error_message = None if success else "Connection failed"
            return success
        except Exception as e:
            source.status = ConnectionStatus.ERROR
            source.error_message = str(e)
            return False
    
    def _test_connection_by_type(self, source: DataSourceConfig) -> bool:
        """Test connection based on data source type"""
        if source.type == DataSourceType.DATABASE:
            return self._test_database_connection(source)
        elif source.type == DataSourceType.API:
            return self._test_api_connection(source)
        elif source.type == DataSourceType.FILE_SYSTEM:
            return self._test_file_system_connection(source)
        elif source.type == DataSourceType.FTP:
            return self._test_ftp_connection(source)
        elif source.type == DataSourceType.EMAIL:
            return self._test_email_connection(source)
        elif source.type in [DataSourceType.GST_PORTAL, DataSourceType.MCA_PORTAL]:
            return self._test_portal_connection(source)
        else:
            return False
    
    def _test_database_connection(self, source: DataSourceConfig) -> bool:
        """Test database connection"""
        try:
            config = source.config
            db_type = config.get("database_type", DatabaseType.POSTGRESQL.value)
            
            if db_type == DatabaseType.POSTGRESQL.value:
                connection_string = f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            elif db_type == DatabaseType.MYSQL.value:
                connection_string = f"mysql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            elif db_type == DatabaseType.SQLITE.value:
                connection_string = f"sqlite:///{config['database']}"
            else:
                return False
            
            engine = create_engine(connection_string, connect_args={"connect_timeout": config.get("connection_timeout", 30)})
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                return result.fetchone() is not None
        except SQLAlchemyError:
            return False
    
    def _test_api_connection(self, source: DataSourceConfig) -> bool:
        """Test API connection"""
        try:
            config = source.config
            headers = config.get("headers", {})
            
            if config.get("auth_type") == "api_key" and config.get("api_key"):
                headers["Authorization"] = f"Bearer {config['api_key']}"
            
            response = requests.get(
                f"{config['base_url']}/health",
                headers=headers,
                timeout=config.get("timeout", 30)
            )
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    def _test_file_system_connection(self, source: DataSourceConfig) -> bool:
        """Test file system connection"""
        try:
            config = source.config
            base_path = Path(config["base_path"])
            
            # Create directory if it doesn't exist
            base_path.mkdir(parents=True, exist_ok=True)
            
            # Test read/write access
            test_file = base_path / ".test_access"
            test_file.write_text("test", encoding=config.get("encoding", "utf-8"))
            content = test_file.read_text(encoding=config.get("encoding", "utf-8"))
            test_file.unlink()
            
            return content == "test"
        except Exception:
            return False
    
    def _test_ftp_connection(self, source: DataSourceConfig) -> bool:
        """Test FTP connection"""
        try:
            config = source.config
            ftp = ftplib.FTP()
            ftp.connect(config["host"], config.get("port", 21), config.get("timeout", 30))
            ftp.login(config["username"], config["password"])
            ftp.pwd()
            ftp.quit()
            return True
        except ftplib.all_errors:
            return False
    
    def _test_email_connection(self, source: DataSourceConfig) -> bool:
        """Test email connection"""
        try:
            config = source.config
            server = smtplib.SMTP(config["smtp_server"], config.get("smtp_port", 587))
            if config.get("use_tls", True):
                server.starttls()
            server.login(config["username"], config["password"])
            server.quit()
            return True
        except smtplib.SMTPException:
            return False
    
    def _test_portal_connection(self, source: DataSourceConfig) -> bool:
        """Test government portal connection"""
        try:
            config = source.config
            headers = config.get("headers", {})
            
            if config.get("api_key"):
                headers["Authorization"] = f"Bearer {config['api_key']}"
            
            # Test with a simple status endpoint
            response = requests.get(
                f"{config['base_url']}/api/status",
                headers=headers,
                timeout=config.get("timeout", 30)
            )
            return response.status_code in [200, 401]  # 401 might indicate valid endpoint but auth needed
        except requests.RequestException:
            return False
    
    def connect_data_source(self, source_id: str) -> bool:
        """Establish connection to a data source"""
        if source_id not in self.data_sources:
            return False
        
        source = self.data_sources[source_id]
        
        try:
            connection = self._create_connection(source)
            if connection:
                self.active_connections[source_id] = connection
                source.status = ConnectionStatus.CONNECTED
                return True
            return False
        except Exception as e:
            source.status = ConnectionStatus.ERROR
            source.error_message = str(e)
            return False
    
    def _create_connection(self, source: DataSourceConfig) -> Optional[Any]:
        """Create connection object based on data source type"""
        if source.type == DataSourceType.DATABASE:
            return self._create_database_connection(source)
        elif source.type == DataSourceType.API:
            return self._create_api_connection(source)
        elif source.type == DataSourceType.FILE_SYSTEM:
            return self._create_file_system_connection(source)
        elif source.type == DataSourceType.FTP:
            return self._create_ftp_connection(source)
        return None
    
    def _create_database_connection(self, source: DataSourceConfig) -> Optional[Any]:
        """Create database connection"""
        try:
            config = source.config
            db_type = config.get("database_type", DatabaseType.POSTGRESQL.value)
            
            if db_type == DatabaseType.POSTGRESQL.value:
                connection_string = f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            elif db_type == DatabaseType.MYSQL.value:
                connection_string = f"mysql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            elif db_type == DatabaseType.SQLITE.value:
                connection_string = f"sqlite:///{config['database']}"
            else:
                return None
            
            engine = create_engine(
                connection_string,
                pool_size=config.get("pool_size", 10),
                connect_args={"connect_timeout": config.get("connection_timeout", 30)}
            )
            return engine
        except Exception:
            return None
    
    def _create_api_connection(self, source: DataSourceConfig) -> Optional[Dict[str, Any]]:
        """Create API connection configuration"""
        config = source.config
        headers = config.get("headers", {}).copy()
        
        if config.get("auth_type") == "api_key" and config.get("api_key"):
            headers["Authorization"] = f"Bearer {config['api_key']}"
        
        return {
            "base_url": config["base_url"],
            "headers": headers,
            "timeout": config.get("timeout", 30),
            "rate_limit": config.get("rate_limit", 100)
        }
    
    def _create_file_system_connection(self, source: DataSourceConfig) -> Optional[Dict[str, Any]]:
        """Create file system connection configuration"""
        config = source.config
        base_path = Path(config["base_path"])
        
        # Ensure directory exists
        base_path.mkdir(parents=True, exist_ok=True)
        
        return {
            "base_path": base_path,
            "access_mode": config.get("access_mode", "read_write"),
            "file_extensions": config.get("file_extensions", []),
            "max_file_size": config.get("max_file_size", 100 * 1024 * 1024),
            "encoding": config.get("encoding", "utf-8")
        }
    
    def _create_ftp_connection(self, source: DataSourceConfig) -> Optional[ftplib.FTP]:
        """Create FTP connection"""
        try:
            config = source.config
            ftp = ftplib.FTP()
            ftp.connect(config["host"], config.get("port", 21), config.get("timeout", 30))
            ftp.login(config["username"], config["password"])
            
            if config.get("passive_mode", True):
                ftp.set_pasv(True)
            
            return ftp
        except ftplib.all_errors:
            return None
    
    def disconnect_data_source(self, source_id: str) -> bool:
        """Disconnect from a data source"""
        if source_id in self.active_connections:
            try:
                connection = self.active_connections[source_id]
                
                # Close connection based on type
                if hasattr(connection, 'dispose'):  # SQLAlchemy engine
                    connection.dispose()
                elif hasattr(connection, 'quit'):  # FTP connection
                    connection.quit()
                
                del self.active_connections[source_id]
                
                if source_id in self.data_sources:
                    self.data_sources[source_id].status = ConnectionStatus.DISCONNECTED
                
                return True
            except Exception as e:
                print(f"Error disconnecting from {source_id}: {str(e)}")
                return False
        return True
    
    def get_connection(self, source_id: str) -> Optional[Any]:
        """Get active connection for a data source"""
        return self.active_connections.get(source_id)
    
    def execute_query(self, source_id: str, query: str) -> Optional[pd.DataFrame]:
        """Execute query on a database data source"""
        connection = self.get_connection(source_id)
        if not connection:
            if not self.connect_data_source(source_id):
                return None
            connection = self.get_connection(source_id)
        
        if not connection:
            return None
        
        try:
            return pd.read_sql_query(query, connection)
        except Exception as e:
            print(f"Error executing query: {str(e)}")
            return None
    
    def make_api_request(self, source_id: str, endpoint: str, method: str = "GET", data: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make API request to a configured API data source"""
        connection = self.get_connection(source_id)
        if not connection:
            if not self.connect_data_source(source_id):
                return None
            connection = self.get_connection(source_id)
        
        if not connection:
            return None
        
        try:
            url = f"{connection['base_url']}/{endpoint.lstrip('/')}"
            
            if method.upper() == "GET":
                response = requests.get(url, headers=connection["headers"], timeout=connection["timeout"])
            elif method.upper() == "POST":
                response = requests.post(url, headers=connection["headers"], json=data, timeout=connection["timeout"])
            elif method.upper() == "PUT":
                response = requests.put(url, headers=connection["headers"], json=data, timeout=connection["timeout"])
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=connection["headers"], timeout=connection["timeout"])
            else:
                return None
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error making API request: {str(e)}")
            return None
    
    def read_file(self, source_id: str, file_path: str) -> Optional[Union[str, bytes]]:
        """Read file from a file system data source"""
        connection = self.get_connection(source_id)
        if not connection:
            if not self.connect_data_source(source_id):
                return None
            connection = self.get_connection(source_id)
        
        if not connection:
            return None
        
        try:
            full_path = connection["base_path"] / file_path
            
            if not full_path.exists():
                return None
            
            # Check file size
            if full_path.stat().st_size > connection["max_file_size"]:
                return None
            
            # Check file extension
            if connection["file_extensions"] and full_path.suffix not in connection["file_extensions"]:
                return None
            
            return full_path.read_text(encoding=connection["encoding"])
        except Exception as e:
            print(f"Error reading file: {str(e)}")
            return None
    
    def write_file(self, source_id: str, file_path: str, content: Union[str, bytes]) -> bool:
        """Write file to a file system data source"""
        connection = self.get_connection(source_id)
        if not connection:
            if not self.connect_data_source(source_id):
                return False
            connection = self.get_connection(source_id)
        
        if not connection:
            return False
        
        try:
            if connection["access_mode"] == "read_only":
                return False
            
            full_path = connection["base_path"] / file_path
            
            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Check file extension
            if connection["file_extensions"] and full_path.suffix not in connection["file_extensions"]:
                return False
            
            if isinstance(content, str):
                full_path.write_text(content, encoding=connection["encoding"])
            else:
                full_path.write_bytes(content)
            
            return True
        except Exception as e:
            print(f"Error writing file: {str(e)}")
            return False
    
    def get_data_source_statistics(self, source_id: str) -> Dict[str, Any]:
        """Get statistics for a data source"""
        source = self.get_data_source(source_id)
        if not source:
            return {}
        
        stats = {
            "id": source.id,
            "name": source.name,
            "type": source.type.value,
            "status": source.status.value,
            "is_active": source.is_active,
            "last_tested": source.last_tested.isoformat() if source.last_tested else None,
            "error_message": source.error_message,
            "is_connected": source_id in self.active_connections
        }
        
        if source.type == DataSourceType.DATABASE:
            stats.update(self._get_database_stats(source_id))
        elif source.type == DataSourceType.FILE_SYSTEM:
            stats.update(self._get_file_system_stats(source_id))
        
        return stats
    
    def _get_database_stats(self, source_id: str) -> Dict[str, Any]:
        """Get database-specific statistics"""
        try:
            connection = self.get_connection(source_id)
            if not connection:
                return {}
            
            # Get basic database info
            with connection.connect() as conn:
                result = conn.execute(text("SELECT current_database(), version()"))
                row = result.fetchone()
                
                return {
                    "database_name": row[0] if row else None,
                    "database_version": row[1] if row else None,
                    "connection_pool_size": connection.pool.size() if hasattr(connection, 'pool') else None
                }
        except Exception:
            return {}
    
    def _get_file_system_stats(self, source_id: str) -> Dict[str, Any]:
        """Get file system-specific statistics"""
        try:
            connection = self.get_connection(source_id)
            if not connection:
                return {}
            
            base_path = connection["base_path"]
            if not base_path.exists():
                return {}
            
            # Count files and calculate total size
            file_count = 0
            total_size = 0
            
            for file_path in base_path.rglob("*"):
                if file_path.is_file():
                    file_count += 1
                    total_size += file_path.stat().st_size
            
            return {
                "total_files": file_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "base_path": str(base_path)
            }
        except Exception:
            return {}
    
    def export_configurations(self) -> Dict[str, Any]:
        """Export all data source configurations"""
        export_data = {
            "version": "1.0",
            "exported_at": datetime.now().isoformat(),
            "data_sources": []
        }
        
        for source in self.data_sources.values():
            source_data = asdict(source)
            # Remove sensitive information
            if "password" in source_data.get("config", {}):
                source_data["config"]["password"] = "***REDACTED***"
            if "api_key" in source_data.get("config", {}):
                source_data["config"]["api_key"] = "***REDACTED***"
            
            export_data["data_sources"].append(source_data)
        
        return export_data
    
    def import_configurations(self, import_data: Dict[str, Any]) -> bool:
        """Import data source configurations"""
        try:
            if "data_sources" not in import_data:
                return False
            
            for source_data in import_data["data_sources"]:
                # Skip if sensitive data is redacted
                config = source_data.get("config", {})
                if config.get("password") == "***REDACTED***" or config.get("api_key") == "***REDACTED***":
                    continue
                
                source = DataSourceConfig(**source_data)
                self.add_data_source(source)
            
            return True
        except Exception as e:
            print(f"Error importing configurations: {str(e)}")
            return False