import requests
import rethinkdb as r

data = requests.get('http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json').json()
validData=filter(lambda ac: {'Icao','Lat','Long'} <= set(ac) , data['acList'])
res=map(lambda ac: {'id':ac['Icao'], 'lat':ac['Lat'], 'lon': ac['Long']},validData)

conn=r.connect('localhost', 28015)
r.db('flightglobe').table('flight_position').insert(res).run(conn)