#!/usr/bin/env python3
"""
Master E2E Test Suite Runner (Python & FastAPI ML Ecosystem)
Executes Tier 1, Tier 3, and Tier 4 automated test suites using unittest runner.
Outputs unified pass/fail results and exits with code 0 on full pass.
"""

import unittest
import sys
import os
import time

ANSI_RESET = "\033[0m"
ANSI_BOLD = "\033[1m"
ANSI_GREEN = "\033[32m"
ANSI_RED = "\033[31m"
ANSI_YELLOW = "\033[33m"
ANSI_CYAN = "\033[36m"
ANSI_DIM = "\033[2m"

TEST_MODULES = [
    # Tier 1: Schemas
    ("Tier 1: Pydantic v2 Schemas & Validation", "tests.unit.pydantic_schemas.test"),
    # Tier 3: ML Microservice
    ("Tier 3: Feature Engineering & Telemetry Fusion", "tests.ml_service.test_feature_engineering"),
    ("Tier 3: Model Performance & Latency Budget", "tests.ml_service.test_model_performance"),
    ("Tier 3: Prescriptive Corrective Engine", "tests.ml_service.test_corrective_engine"),
    ("Tier 3: FastAPI REST Interface & Health", "tests.ml_service.test_inference_endpoints"),
    # Tier 4: Cross-Service E2E Workflows
    ("Tier 4: Cross-Service Telemetry to Alert Workflow", "tests.e2e.test_telemetry_to_alert"),
]


def run_master_suite():
    # Ensure project root is on sys.path
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    backend_dir = os.path.join(project_root, "backend")
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    print(f"{ANSI_BOLD}{ANSI_CYAN}==============================================================================={ANSI_RESET}")
    print(f"{ANSI_BOLD}{ANSI_CYAN}    MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — PYTHON TEST RUNNER        {ANSI_RESET}")
    print(f"{ANSI_BOLD}{ANSI_CYAN}==============================================================================={ANSI_RESET}\n")

    loader = unittest.TestLoader()
    suite_results = []
    total_tests = 0
    total_failures = 0
    total_errors = 0
    overall_start = time.perf_counter()

    for label, mod_name in TEST_MODULES:
        sys.stdout.write(f"{ANSI_BOLD}[RUN]{ANSI_RESET} {label.ljust(55)} ... ")
        sys.stdout.flush()

        start = time.perf_counter()
        try:
            mod = __import__(mod_name, fromlist=["*"])
            suite = loader.loadTestsFromModule(mod)
            runner = unittest.TextTestRunner(stream=open(os.devnull, "w"), verbosity=0)
            res = runner.run(suite)
            duration_ms = (time.perf_counter() - start) * 1000.0

            tests_run = res.testsRun
            fails = len(res.failures)
            errs = len(res.errors)

            total_tests += tests_run
            total_failures += fails
            total_errors += errs

            if res.wasSuccessful():
                print(f"{ANSI_GREEN}PASS{ANSI_RESET} {ANSI_DIM}({duration_ms:.1f}ms, {tests_run} tests){ANSI_RESET}")
                suite_results.append({"name": label, "status": "PASS", "tests": tests_run, "duration_ms": duration_ms})
            else:
                print(f"{ANSI_RED}FAIL{ANSI_RESET} {ANSI_DIM}({duration_ms:.1f}ms, {fails} fails, {errs} errs){ANSI_RESET}")
                suite_results.append({"name": label, "status": "FAIL", "failures": res.failures, "errors": res.errors})
        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000.0
            print(f"{ANSI_RED}ERROR{ANSI_RESET} {ANSI_DIM}({duration_ms:.1f}ms){ANSI_RESET}")
            total_errors += 1
            suite_results.append({"name": label, "status": "ERROR", "exception": str(e)})

    total_duration = time.perf_counter() - overall_start

    print(f"\n{ANSI_BOLD}{ANSI_CYAN}-------------------------------------------------------------------------------{ANSI_RESET}")
    print(f"{ANSI_BOLD}PYTHON E2E TEST SUMMARY:{ANSI_RESET}")
    print(f"  Total Test Cases   : {total_tests}")
    print(f"  Suites Passed      : {ANSI_GREEN}{sum(1 for s in suite_results if s['status'] == 'PASS')}{ANSI_RESET} / {len(TEST_MODULES)}")
    print(f"  Total Failures     : {ANSI_RED if total_failures > 0 else ANSI_GREEN}{total_failures}{ANSI_RESET}")
    print(f"  Total Errors       : {ANSI_RED if total_errors > 0 else ANSI_GREEN}{total_errors}{ANSI_RESET}")
    print(f"  Total Execution    : {total_duration:.2f}s")
    print(f"{ANSI_BOLD}{ANSI_CYAN}==============================================================================={ANSI_RESET}\n")

    if total_failures > 0 or total_errors > 0:
        print(f"{ANSI_RED}{ANSI_BOLD}FAILURES / ERRORS DETECTED:{ANSI_RESET}")
        for s in suite_results:
            if s["status"] != "PASS":
                print(f"\n{ANSI_RED}--- {s['name']} ---{ANSI_RESET}")
                if "failures" in s:
                    for test, traceback in s["failures"]:
                        print(f"Failure in {test}:\n{traceback}")
                if "errors" in s:
                    for test, traceback in s["errors"]:
                        print(f"Error in {test}:\n{traceback}")
                if "exception" in s:
                    print(f"Exception: {s['exception']}")
        sys.exit(1)
    else:
        print(f"{ANSI_GREEN}{ANSI_BOLD}>>> ALL PYTHON TEST SUITES PASSED CLEANLY (100% PASS RATE) <<<\n{ANSI_RESET}")
        sys.exit(0)


if __name__ == "__main__":
    run_master_suite()
