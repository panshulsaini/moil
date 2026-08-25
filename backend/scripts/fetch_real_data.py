import os
import urllib.request
import pandas as pd
import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
os.makedirs(DATA_DIR, exist_ok=True)

def fetch_ai4i_telemetry():
    """Fetches the Kaggle/UCI Predictive Maintenance Dataset"""
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00601/ai4i2020.csv"
    filepath = os.path.join(DATA_DIR, "ai4i2020_telemetry.csv")
    
    if not os.path.exists(filepath):
        print(f"Downloading Kaggle AI4I 2020 Predictive Maintenance Dataset...")
        urllib.request.urlretrieve(url, filepath)
        print("Download complete.")
    else:
        print("AI4I Telemetry Dataset already exists locally.")

def fetch_open_meteo_historical():
    """Fetches real historical weather data for MOIL Balaghat Mine coordinates"""
    filepath = os.path.join(DATA_DIR, "open_meteo_balaghat.csv")
    if os.path.exists(filepath):
        print("Open-Meteo Weather Dataset already exists locally.")
        return

    print("Fetching Open-Meteo Historical Weather (Balaghat)...")
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        "?latitude=21.8129&longitude=80.1838"
        "&start_date=2023-01-01&end_date=2023-12-31"
        "&hourly=temperature_2m,rain,soil_moisture_0_to_7cm"
        "&timezone=Asia%2FKolkata"
    )
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        df = pd.DataFrame({
            "timestamp": data["hourly"]["time"],
            "temperature_c": data["hourly"]["temperature_2m"],
            "rain_mm": data["hourly"]["rain"],
            "soil_moisture_pct": [
                val * 100 if val is not None else 0 
                for val in data["hourly"]["soil_moisture_0_to_7cm"]
            ]
        })
        # Forward fill missing values
        df.ffill(inplace=True)
        df.to_csv(filepath, index=False)
        print("Open-Meteo historical fetch complete.")
    else:
        print(f"Failed to fetch weather data: HTTP {response.status_code}")

if __name__ == "__main__":
    fetch_ai4i_telemetry()
    fetch_open_meteo_historical()
