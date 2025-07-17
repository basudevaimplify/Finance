#!/usr/bin/env python3
"""
QRT Closure Platform - User-Friendly Test Execution Script
Easy-to-use script for running comprehensive tests with the generated dataset
"""

import sys
import json
import time
from comprehensive_test_runner import ComprehensiveTestRunner
from test_dataset_generator import TestDatasetGenerator

def print_banner():
    """Print test banner"""
    print("=" * 60)
    print("🚀 QRT Closure Platform - Comprehensive Test Suite")
    print("=" * 60)
    print()

def print_menu():
    """Print test menu options"""
    print("Available Test Options:")
    print("1. Generate fresh test dataset")
    print("2. Run all comprehensive tests")
    print("3. Run specific test category")
    print("4. View test dataset summary")
    print("5. View previous test results")
    print("6. Quick smoke test")
    print("0. Exit")
    print()

def generate_test_dataset():
    """Generate test dataset"""
    print("🔄 Generating comprehensive test dataset...")
    generator = TestDatasetGenerator()
    generator.generate_all_test_data()
    print("✅ Test dataset generated successfully!")
    print("📁 Files created in test_data/ directory")
    print()

def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print("🚀 Starting comprehensive test suite...")
    runner = ComprehensiveTestRunner()
    report = runner.run_all_tests()
    
    if report:
        print("\n📊 Test Summary:")
        print(f"Total Tests: {report['test_summary']['total_tests']}")
        print(f"Passed: {report['test_summary']['passed_tests']}")
        print(f"Failed: {report['test_summary']['failed_tests']}")
        print(f"Success Rate: {report['test_summary']['success_rate']}")
        
        if report['test_summary']['failed_tests'] > 0:
            print("\n⚠️  Some tests failed. Check the detailed report for more information.")
        else:
            print("\n🎉 All tests passed!")
    
    print()

def run_specific_test_category():
    """Run specific test category"""
    print("Select test category:")
    print("1. Document Upload Tests")
    print("2. AI Agent Workflow Tests")
    print("3. Financial Reporting Tests")
    print("4. Compliance Validation Tests")
    print("5. Performance Tests")
    print("6. Error Handling Tests")
    print()
    
    try:
        choice = int(input("Enter your choice (1-6): "))
        
        runner = ComprehensiveTestRunner()
        if not runner.setup_authentication():
            print("❌ Authentication setup failed.")
            return
        
        if choice == 1:
            runner.test_document_upload_scenarios()
        elif choice == 2:
            runner.test_ai_agent_workflows()
        elif choice == 3:
            runner.test_financial_reporting()
        elif choice == 4:
            runner.test_compliance_validation()
        elif choice == 5:
            runner.test_performance_scenarios()
        elif choice == 6:
            runner.test_error_handling_scenarios()
        else:
            print("❌ Invalid choice")
            return
        
        runner.generate_test_report()
        print("✅ Test category completed!")
        
    except ValueError:
        print("❌ Invalid input. Please enter a number.")
    except Exception as e:
        print(f"❌ Test execution failed: {e}")

def view_dataset_summary():
    """View test dataset summary"""
    try:
        with open("test_data/dataset_summary.json", "r") as f:
            summary = json.load(f)
        
        print("📊 Test Dataset Summary:")
        print(f"Generation Date: {summary['generation_date']}")
        print(f"Total Records: {summary['total_records']}")
        print("\nFiles Created:")
        for file in summary['files_created']:
            print(f"  • {file}")
        
        print("\nCoverage:")
        for coverage in summary['coverage']:
            print(f"  ✓ {coverage}")
        
    except FileNotFoundError:
        print("❌ Dataset summary not found. Please generate dataset first.")
    except Exception as e:
        print(f"❌ Error reading dataset summary: {e}")
    
    print()

def view_previous_results():
    """View previous test results"""
    try:
        with open("test_data/comprehensive_test_report.json", "r") as f:
            report = json.load(f)
        
        print("📋 Previous Test Results:")
        print(f"Execution Date: {report['test_summary']['execution_date']}")
        print(f"Total Tests: {report['test_summary']['total_tests']}")
        print(f"Success Rate: {report['test_summary']['success_rate']}")
        
        print("\nTest Categories:")
        for category, count in report['test_categories'].items():
            print(f"  • {category.replace('_', ' ').title()}: {count} tests")
        
        if report.get('recommendations'):
            print("\nRecommendations:")
            for rec in report['recommendations']:
                print(f"  • {rec}")
        
    except FileNotFoundError:
        print("❌ No previous test results found. Please run tests first.")
    except Exception as e:
        print(f"❌ Error reading test results: {e}")
    
    print()

def quick_smoke_test():
    """Run quick smoke test"""
    print("🔥 Running quick smoke test...")
    
    runner = ComprehensiveTestRunner()
    if not runner.setup_authentication():
        print("❌ Authentication setup failed.")
        return
    
    # Run essential tests only
    try:
        start_time = time.time()
        
        # Test authentication
        print("Testing authentication...")
        auth_success = runner.setup_authentication()
        
        # Test basic API endpoints
        print("Testing API endpoints...")
        runner.test_performance_scenarios()
        
        # Test file upload with a small file
        print("Testing file upload...")
        if os.path.exists("test_data/journal_entries_comprehensive.csv"):
            runner.upload_test_file("test_data/journal_entries_comprehensive.csv")
        
        duration = time.time() - start_time
        
        print(f"✅ Smoke test completed in {duration:.2f}s")
        
        # Show basic results
        passed_tests = sum(1 for r in runner.test_results if r["passed"])
        total_tests = len(runner.test_results)
        
        print(f"📊 Results: {passed_tests}/{total_tests} tests passed")
        
    except Exception as e:
        print(f"❌ Smoke test failed: {e}")
    
    print()

def main():
    """Main execution function"""
    print_banner()
    
    while True:
        print_menu()
        
        try:
            choice = input("Enter your choice (0-6): ").strip()
            
            if choice == '0':
                print("👋 Goodbye!")
                sys.exit(0)
            elif choice == '1':
                generate_test_dataset()
            elif choice == '2':
                run_comprehensive_tests()
            elif choice == '3':
                run_specific_test_category()
            elif choice == '4':
                view_dataset_summary()
            elif choice == '5':
                view_previous_results()
            elif choice == '6':
                quick_smoke_test()
            else:
                print("❌ Invalid choice. Please enter a number between 0-6.")
                print()
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            sys.exit(0)
        except Exception as e:
            print(f"❌ Error: {e}")
            print()

if __name__ == "__main__":
    main()