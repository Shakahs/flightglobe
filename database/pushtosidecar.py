import json
from urllib import request, parse
import plpy

try:
    outputData = json.dumps({'icao':NEW.icao, 'lat':NEW.lat, 'lng': NEW.lng, 'time':1539039860})
    encodedData = parse.urlencode(outputData).encode()
except Exception as e:
    plpy.warning("error encoding data " + e)

try:
    req = request.Request("localhost:8080", data=encodedData)
    resp = request.urlopen(req)
except Exception as e:
    plpy.warning("error posting data " + e)