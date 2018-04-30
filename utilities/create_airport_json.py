import csv
import json

allAirports={}

mapping = [
    ('altitude','elevation_ft'),
    ('city','municipality'),
    ('iata','iata_code'),
    ('country','iso_country'),
    ('name','name'),
]

with open('airports.csv','r',encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        newObj = {}
        # newObj['icao'] = row['ident']
        newObj['lng'],newObj['lat'] = row['coordinates'].split(',')
        newObj['lng'] = round(float(newObj['lng']),3)
        newObj['lat'] = round(float(newObj['lat']),3)

        for pair in mapping:
            if(len(row[pair[1]])>1):
                newObj[pair[0]]=row[pair[1]]

        if('altitude' in newObj):
            newObj['altitude'] = int(newObj['altitude'])

        allAirports[row['ident']]=newObj
        # print(row['ident'],newObj['name'])


with open('airports.json','w+',encoding='utf8') as jsonfile:
    json.dump(allAirports,jsonfile,ensure_ascii=False)

print(len(list(allAirports.keys())), " airports exported")