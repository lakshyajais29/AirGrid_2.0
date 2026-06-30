import csv
from datetime import datetime

input_file = 'aqi_sensor_log_100000.csv'
output_file = 'drone_mission_aqi_formatted.csv'

with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    reader = csv.DictReader(infile)
    writer = csv.writer(outfile)
    
    writer.writerow(['timestamp', 'lat', 'lng', 'mq135', 'mq9', 'mq2', 'satellites', 'temperature', 'humidity'])
    
    for row in reader:
        try:
            dt = datetime.strptime(row['Timestamp'], '%Y-%m-%d %H:%M:%S')
            ts = int(dt.timestamp() * 1000)
            
            lat = row['Latitude']
            lng = row['Longitude']
            mq135 = row['MQ135']
            mq9 = row['MQ9']
            mq2 = row['MQ2']
            sats = 12 
            temp = row['Temperature']
            hum = row['Humidity']
            
            writer.writerow([ts, lat, lng, mq135, mq9, mq2, sats, temp, hum])
        except Exception as e:
            print(f"Error parsing row: {row}. Error: {e}")
            pass
