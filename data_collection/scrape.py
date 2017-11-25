import requests
import rethinkdb as r
import time

conn=r.connect('localhost', 28015)

def scrapeADSB():
    rawData = requests.get('http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json').json()
    validData=filter(lambda ac: {'Icao','Lat','Long','PosTime','Trak','Galt'} <= set(ac) , rawData['acList'])
    finalData=map(lambda ac: {'id':ac['Icao'], 'lat':ac['Lat'], 'lon': ac['Long'],
                              'time': int(str(ac['PosTime'])[:-3]), 'heading': ac['Trak'],
                              'altitude': float(ac['Galt'])/3.28},validData)
    return finalData

openSkyFields=['icao24','callsign','origin_country','time_position','last_contact','longitude','latitude',
                 'geo_altitude','on_ground','velocity','heading','vertical_rate','sensors','baro_altitude',
                 'squaks','spi','position_source']
def scrapeOpenSky():
    rawData = requests.get('https://opensky-network.org/api/states/all').json()
    mappedData=map(lambda single: {k[1]: single[k[0]] for k in enumerate(openSkyFields)}, rawData['states'])
    validData = filter(lambda ac: all([ac['icao24'], ac['latitude'], ac['longitude'], ac['time_position'],
                                       ac['heading'], ac['baro_altitude']]), mappedData)
    finalData = map(lambda ac: {'id': ac['icao24'].upper(), 'lat': ac['latitude'], 'lon': ac['longitude'],
                                'time': ac['time_position'], 'heading': ac['heading'], 'altitude': ac['baro_altitude']},
                    validData)
    return finalData

def merge(a,b):
    mergedData = {k['id']: k for k in a}
    for plane in b:
        if (plane['id'] not in mergedData) or (mergedData[plane['id']]['time'] < plane['time']):
            mergedData[plane['id']] = plane

    return mergedData

while(True):
    adsbresult = scrapeADSB()
    osresult = scrapeOpenSky()
    mergedData = merge(adsbresult, osresult)
    insertResult = r.db('flightglobe').table('flight_position').insert(mergedData.values(), conflict="replace").run(conn)
    print(insertResult)
    time.sleep(10)

