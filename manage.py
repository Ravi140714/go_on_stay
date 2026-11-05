#!/usr/bin/env python
"""
Root manage.py for the GoOnStay project.
Allows running Django commands and launching the full project directly from the root directory.

Usage:
    python manage.py runserver           -> Starts Backend (Django) + Frontend (Vite)
    python manage.py runserver --no-ui   -> Starts Backend (Django) only
    python manage.py migrate             -> Runs database migrations
    python manage.py <any_django_cmd>    -> Runs any standard Django command
"""
import os
import sys
import socket
import atexit
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = Path("E:/BookMyRoomBackend") if Path("E:/BookMyRoomBackend").exists() else ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = ROOT_DIR / "venv" / "Scripts" / "python.exe"

frontend_process = None


def is_port_in_use(port, host="127.0.0.1"):
    """Check if a network port is already in use."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def stop_frontend():
    """Cleanly terminate the frontend process tree on exit."""
    global frontend_process
    if frontend_process and frontend_process.poll() is None:
        try:
            # On Windows, taskkill /T kills the entire process tree (cmd.exe + node.exe)
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(frontend_process.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            try:
                frontend_process.kill()
            except Exception:
                pass


def maybe_start_frontend():
    """Start Vite dev server if runserver is invoked and frontend is not already running."""
    global frontend_process

    # Check for --no-ui flag
    if "--no-ui" in sys.argv:
        sys.argv.remove("--no-ui")
        return

    # In Django autoreload, only launch frontend in the supervisor (parent) process
    if os.environ.get("RUN_MAIN") == "true":
        return

    if is_port_in_use(5173):
        print("\n[GoOnStay] Frontend is already running at http://localhost:5173")
        return

    if not FRONTEND_DIR.exists():
        return

    print("\n" + "=" * 62)
    print("  🚀 Starting GoOnStay Project...")
    print("  👉 Frontend (Vite):   http://localhost:5173")
    print("  👉 Backend (Django):  http://127.0.0.1:8000")
    print("  👉 Admin Panel:       http://127.0.0.1:8000/admin")
    print("=" * 62 + "\n")

    try:
        frontend_process = subprocess.Popen(
            "npm run dev",
            cwd=str(FRONTEND_DIR),
            shell=True,
        )
        atexit.register(stop_frontend)
    except Exception as e:
        print(f"[GoOnStay] Notice: Could not auto-start frontend (npm): {e}")


def main():
    """Run administrative tasks."""
    # Ensure backend directory is in Python path and is current working directory
    sys.path.insert(0, str(BACKEND_DIR))
    os.chdir(BACKEND_DIR)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # If Django is not in global Python, try running via the project venv
        if VENV_PYTHON.exists() and sys.executable.lower() != str(VENV_PYTHON).lower():
            cmd = [str(VENV_PYTHON), str(ROOT_DIR / "manage.py")] + sys.argv[1:]
            sys.exit(subprocess.call(cmd))
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # If runserver is specified, also start frontend
    if len(sys.argv) > 1 and sys.argv[1] == "runserver":
        maybe_start_frontend()

    try:
        execute_from_command_line(sys.argv)
    finally:
        stop_frontend()


if __name__ == "__main__":
    main()
