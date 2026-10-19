import os
import sys

# ANSI Color & Style Codes (Hacker/Cyberpunk Aesthetic)
C_GREEN = "\033[92m"
C_CYAN = "\033[96m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_BOLD = "\033[1m"
C_RESET = "\033[0m"

def log_hacker(msg: str):
    print(f"{C_GREEN}[SYSTEM]{C_RESET} {msg}")

def log_warn(msg: str):
    print(f"{C_YELLOW}[WARNING]{C_RESET} {msg}")

def log_error(msg: str):
    print(f"{C_RED}[ERROR]{C_RESET} {msg}")

def parse_env(filepath: str = ".env") -> dict:
    """Reads existing .env file into a dictionary."""
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip().strip("'").strip('"')
    return env_vars

def write_env(env_vars: dict, filepath: str = ".env"):
    """Writes dictionary back to the .env file."""
    with open(filepath, "w", encoding="utf-8") as f:
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")

def prompt(question: str, default: str = "") -> str:
    """Prompts user. Empty input returns the default value."""
    if default:
        user_input = input(f" {C_CYAN}❯{C_RESET} {question} [{C_YELLOW}{default}{C_RESET}]: ").strip()
        return user_input if user_input != "" else default
    return input(f" {C_CYAN}❯{C_RESET} {question}: ").strip()

def print_banner():
    banner = f"""
{C_GREEN}{C_BOLD}
         ███████╗███████╗████████╗██╗███╗   ██╗██████╗ 
         ██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║██╔══██╗
  ██████╗███████╗█████╗     ██║   ██║██╔██╗ ██║██████╔╝
   ╚════╝╚════██║██╔══╝     ██║   ██║██║╚██╗██║██╔═══╝ 
         ███████║███████╗   ██║   ██║██║ ╚████║██║     
         ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚═╝     
                                 [ MAP-ENV INITIALIZER ]
{C_RESET}"""
    print(banner)

def verify_and_create_db(host: str, port: str, user: str, password: str, db_name: str):
    """Verifies connection to PostgreSQL and creates the database if missing."""
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    log_hacker(f"Attempting vector uplink to host '{C_CYAN}{host}:{port}{C_RESET}'...")
    try:
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=password, dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,))
        if cur.fetchone():
            log_warn(f"Database '{C_YELLOW}{db_name}{C_RESET}' already exists on server. Skipping creation. 🟡")
        else:
            cur.execute(f'CREATE DATABASE "{db_name}";')
            log_hacker(f"Database '{C_GREEN}{db_name}{C_RESET}' deployed successfully! ⚡")

        cur.close()
        conn.close()

    except Exception as e:
        log_error(f"Uplink failed. Reason: {e} 💥")
        sys.exit(1)

def main():
    print_banner()

    env_file = ".env"
    existing_env = parse_env(env_file)

    # 1. Extract existing defaults or fallback parameters (check POSTGRES_* and DB_*)
    def_host = existing_env.get("POSTGRES_HOST") or existing_env.get("DB_HOST", "localhost")
    def_port = existing_env.get("POSTGRES_PORT") or existing_env.get("DB_PORT", "5432")
    def_user = existing_env.get("POSTGRES_USER") or existing_env.get("DB_USER", "postgres")
    def_pass = existing_env.get("POSTGRES_PASSWORD") or existing_env.get("DB_PASSWORD", "postgres")
    def_dbname = existing_env.get("POSTGRES_DB") or existing_env.get("DB_NAME", "RHD-Webmap")

    # 2. Skip prompt wizard if .env exists, but still verify DB existence
    if existing_env:
        log_hacker(f"Existing environment matrix detected at {C_CYAN}`{env_file}`{C_RESET}. 💾")
        skip_all = prompt("Bypass prompt wizard and proceed with current matrix? (y/n)", "y")
        if skip_all.lower() == "y":
            log_hacker(f"Bypass engaged. Verifying database '{C_CYAN}{def_dbname}{C_RESET}' on PostgreSQL server...")
            verify_and_create_db(def_host, def_port, def_user, def_pass, def_dbname)
            log_hacker("Initialization terminated safely. System ready! 🚀")
            sys.exit(0)
        print()

    log_hacker("Initiating database configuration sequence...")
    print(f" {C_YELLOW}ℹ Press [Enter] on any step to retain default value.{C_RESET}\n")

    # 3. Interactive prompts
    host = prompt("Target PostgreSQL Host", def_host)
    port = prompt("Target PostgreSQL Port", def_port)
    user = prompt("Database User", def_user)
    password = prompt("Database Key/Password", def_pass)

    print(f"\n{C_BOLD}Database Deployment Mode:{C_RESET}")
    print("  [1] ⚡ Provision / Verify PostGIS database")
    print("  [2] 🔗 Link to an EXISTING PostGIS database")
    choice = prompt("Select Protocol (1 or 2)", "1")

    db_name = prompt("Target Database Identifier", def_dbname)

    # 4. Handle DB Creation
    if choice == "1":
        verify_and_create_db(host, port, user, password, db_name)

    # 5. Build URL and Update .env with both DB_* and POSTGRES_* aliases
    db_url = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

    existing_env["DB_HOST"] = host
    existing_env["POSTGRES_HOST"] = host
    existing_env["DB_PORT"] = port
    existing_env["POSTGRES_PORT"] = port
    existing_env["DB_USER"] = user
    existing_env["POSTGRES_USER"] = user
    existing_env["DB_PASSWORD"] = password
    existing_env["POSTGRES_PASSWORD"] = password
    existing_env["DB_NAME"] = db_name
    existing_env["POSTGRES_DB"] = db_name
    existing_env["DATABASE_URL"] = db_url

    write_env(existing_env, env_file)

    print(f"\n{C_GREEN}{C_BOLD}======================================================{C_RESET}")
    log_hacker(f"Configuration written to `{C_CYAN}{env_file}{C_RESET}`. System ready! 👾")
    print(f"{C_GREEN}{C_BOLD}======================================================{C_RESET}\n")

if __name__ == "__main__":
    main()