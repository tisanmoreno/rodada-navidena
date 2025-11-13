#!/usr/bin/env python3
"""
Analyze GPX files to extract distance and elevation data
For III Rodada Navideña - Bosques de Pandora
"""

import xml.etree.ElementTree as ET
import math
import glob
import os

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers using Haversine formula"""
    R = 6371  # Earth radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return R * c

def analyze_gpx(filepath):
    """Parse GPX file and extract distance and elevation data"""
    tree = ET.parse(filepath)
    root = tree.getroot()

    # GPX namespace
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}

    # Try with namespace first, then without
    trackpoints = root.findall('.//{http://www.topografix.com/GPX/1/1}trkpt')
    if not trackpoints:
        trackpoints = root.findall('.//trkpt')

    if not trackpoints:
        print(f"Warning: No trackpoints found in {filepath}")
        return None

    total_distance = 0.0
    total_elevation_gain = 0.0
    prev_lat, prev_lon, prev_ele = None, None, None

    min_ele = float('inf')
    max_ele = float('-inf')

    for trkpt in trackpoints:
        lat = float(trkpt.get('lat'))
        lon = float(trkpt.get('lon'))

        # Get elevation (try with namespace first, then without)
        ele_elem = trkpt.find('{http://www.topografix.com/GPX/1/1}ele')
        if ele_elem is None:
            ele_elem = trkpt.find('ele')

        if ele_elem is not None and ele_elem.text:
            ele = float(ele_elem.text)
        else:
            ele = None

        # Calculate distance from previous point
        if prev_lat is not None and prev_lon is not None:
            distance = haversine_distance(prev_lat, prev_lon, lat, lon)
            total_distance += distance

        # Calculate elevation gain
        if ele is not None:
            min_ele = min(min_ele, ele)
            max_ele = max(max_ele, ele)

            if prev_ele is not None:
                ele_diff = ele - prev_ele
                if ele_diff > 0:  # Only count uphill
                    total_elevation_gain += ele_diff

            prev_ele = ele

        prev_lat = lat
        prev_lon = lon

    return {
        'distance_km': round(total_distance, 1),
        'elevation_gain_m': round(total_elevation_gain, 0),
        'min_elevation_m': round(min_ele, 0) if min_ele != float('inf') else None,
        'max_elevation_m': round(max_ele, 0) if max_ele != float('-inf') else None,
        'trackpoints': len(trackpoints)
    }

def main():
    print("🎄 III Rodada Navideña - Análisis de Rutas GPX 🎄\n")
    print("=" * 60)

    routes_dir = 'routes'
    gpx_files = sorted(glob.glob(os.path.join(routes_dir, '*.gpx')))

    if not gpx_files:
        print(f"No GPX files found in {routes_dir}/")
        return

    results = []

    for gpx_file in gpx_files:
        filename = os.path.basename(gpx_file)
        print(f"\n📍 Analizando: {filename}")
        print("-" * 60)

        data = analyze_gpx(gpx_file)

        if data:
            print(f"   Distancia total: {data['distance_km']} km")
            print(f"   Desnivel positivo: {data['elevation_gain_m']:.0f} m")
            if data['min_elevation_m']:
                print(f"   Elevación mínima: {data['min_elevation_m']:.0f} m")
            if data['max_elevation_m']:
                print(f"   Elevación máxima: {data['max_elevation_m']:.0f} m")
            print(f"   Puntos de ruta: {data['trackpoints']:,}")

            results.append({
                'filename': filename,
                **data
            })

    # Summary
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE ETAPAS\n")

    for i, result in enumerate(results, 1):
        etapa_num = result['filename'].split('.')[0].replace('etapa ', 'Etapa ')
        print(f"{etapa_num}:")
        print(f"  📏 {result['distance_km']} km")
        print(f"  ⛰️  {result['elevation_gain_m']:.0f} m")
        print()

    # Generate HTML snippet
    print("=" * 60)
    print("🎨 CÓDIGO HTML PARA ACTUALIZAR:\n")

    day_titles = [
        "El Inicio del Viaje",
        "Bosques Místicos",
        "Montañas de Pandora",
        "Ruta Opcional"
    ]

    for i, result in enumerate(results):
        if i < len(day_titles):
            print(f'''<div class="day-card">
    <div class="day-number">{i+1}</div>
    <h3>Día {i+1}</h3>
    <p class="day-title">{day_titles[i]}</p>
    <div class="day-stats">
        <span>📏 {result['distance_km']} km</span>
        <span>⛰️ {result['elevation_gain_m']:.0f} m</span>
    </div>
    <button class="btn btn-primary">Ver Ruta</button>
</div>
''')

if __name__ == '__main__':
    main()
