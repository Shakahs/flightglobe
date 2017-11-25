import requests
import rethinkdb as r
import time

conn=r.connect('localhost', 28015)

while(True):
    data = requests.get('http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json').json()
    validData=filter(lambda ac: {'Icao','Lat','Long'} <= set(ac) , data['acList'])
    finalData=map(lambda ac: {'id':ac['Icao'], 'lat':ac['Lat'], 'lon': ac['Long']},validData)
    result = r.db('flightglobe').table('flight_position').insert(finalData,conflict="replace").run(conn)
    print(result)
    time.sleep(5)

