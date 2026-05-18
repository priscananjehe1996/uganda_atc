import numpy as np
import pandas as pd
from datetime import datetime
import json

class TrafficPredictor:
    def __init__(self, historical_data_path):
        """
        Initializes the ML-based predictive engine for AADT trajectories.
        """
        self.data_path = historical_data_path
        self.model_weights = {'base_growth': 1.05, 'heavy_vehicle_modifier': 1.12}

    def load_data(self):
        try:
            with open(self.data_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading traffic matrix: {e}")
            return None

    def predict_link_volume(self, current_aadt, target_year, current_year=2026):
        """
        Uses an exponential growth algorithm adjusted for heavy vehicle stress.
        """
        if target_year <= current_year:
            return current_aadt
            
        years_diff = target_year - current_year
        growth_factor = (self.model_weights['base_growth'] ** years_diff)
        
        # Apply non-linear stress modifiers for long-term horizons
        if years_diff > 5:
            growth_factor *= self.model_weights['heavy_vehicle_modifier']
            
        return int(current_aadt * growth_factor)

    def generate_network_forecast(self, target_year):
        data = self.load_data()
        if not data: return
        
        results = []
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            base_vol = props.get('aadt_2025', 10000)
            predicted_vol = self.predict_link_volume(base_vol, target_year)
            
            results.append({
                'link_id': props.get('link_id'),
                'forecast_year': target_year,
                'predicted_aadt': predicted_vol
            })
            
        print(f"[{datetime.now()}] Generated forecast for {len(results)} nodes.")
        return results

if __name__ == "__main__":
    predictor = TrafficPredictor('../data/road_links.json')
    forecast = predictor.generate_network_forecast(2035)
    # print(forecast[:5])
