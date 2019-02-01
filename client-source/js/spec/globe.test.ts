import {globe} from './mockSetup'
import * as Cesium from 'cesium';

describe("the Globe class", ()=>{
   it('creates a globe', ()=>{
       expect(globe.viewer).not.toBeNull();
       expect(globe.viewer).toEqual(jasmine.any(Cesium.Viewer));
   })

    xdescribe('imagery layers', ()=>{
        it('creates a globe with the default Topo imagery layer', ()=>{

        })
    })

});