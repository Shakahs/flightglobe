import CesiumEntity from './primitives/CesiumEntity';
import Cartesian2 from 'cesium/Source/Core/Cartesian2';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import Ellipsoid from 'cesium/Source/Core/Ellipsoid';
import CesiumMath from 'cesium/Source/Core/Math';

export function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  const len = aKeys.length;

  if (bKeys.length !== len) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    const key = aKeys[i];

    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

export const noop = () => {};

export function isUndefined(value) {
  return value === undefined;
}

export function detectViewableArea(viewer) {
  // adapted from https://groups.google.com/forum/#!topic/cesium-dev/qZ8oLz3hFYU
  const CC3 = Cartesian3;
  const camera = viewer.scene.camera;
  const cam = camera;
  const ellipsoid = viewer.scene.globe.ellipsoid;
  const rad = 6371000; // Earth average radius


  function addVectors(vectors) {
    const resultant = new Cartesian3(0, 0, 0);
    let i = 0; while (i < vectors.length) {
      resultant.x += vectors[i].x;
      resultant.y += vectors[i].y;
      resultant.z += vectors[i].z;
      i += 1;
    }
    return resultant;
  }

  function scaleVector(scale, vector) {
    const temp = new Cartesian3();
    temp.x = scale * vector.x; temp.y = scale * vector.y; temp.z = scale * vector.z;
    return temp;
  }

  function rotate(rotatee, rotater, angle) {
    // rotater: unit vector, angle:radians
    // CCW looking from vector tip to vector base
    const rotated = new CC3();
    const c = Math.cos(angle); const s = Math.sin(angle);
    const dotScale = CC3.dot(rotatee, rotater, new CC3());
    const rotaterScaled = scaleVector(dotScale, rotater);
    const vPerpAxis = CC3.subtract(rotatee, rotaterScaled, new CC3()); // using Pythagoras theorem
    const comp1 = scaleVector(c, vPerpAxis);
    const vPerpPerpAxis = CC3.cross(rotater, vPerpAxis, new CC3()); // perp to both of these
    const comp2 = scaleVector(s, vPerpPerpAxis);
    return addVectors([rotaterScaled, comp1, comp2]);
  }

  function dropOne(cartesian) {
    const cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const longitude = CesiumMath.toDegrees(cartographic.longitude).valueOf();
    const latitude = CesiumMath.toDegrees(cartographic.latitude).valueOf();


    console.log(`(${ longitude }, ${ latitude })`);
    return [longitude, latitude];
  }

  // horizon basics
  const dist = CC3.magnitude(camera.position);
  const angle = Math.asin(rad / dist);
  const toSurf = Math.sqrt(Math.pow(dist, 2) - Math.pow(rad, 2));

  // 'horizon arm'
  let rotatee = camera.position.clone();
  rotatee = CC3.negate(rotatee, new CC3());
  CC3.normalize(rotatee, rotatee);
  const rotater = new CC3(0, 0, 1);
  CC3.cross(rotatee, rotater, rotater);
  let rotated = new CC3(); let cartesian = new CC3();
  rotated = rotate(rotatee, rotater, angle);
  cartesian = scaleVector(toSurf, rotated);
  CC3.add(cartesian, camera.position, cartesian);


  // north
  this.viewableArea.north = dropOne(cartesian)[1];

  // east
  cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  this.viewableArea.east = dropOne(cartesian)[0];

  // south
  cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  this.viewableArea.south = dropOne(cartesian)[1];

  // west
  cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  this.viewableArea.west = dropOne(cartesian)[0];


  // // view rectangle
  // const posUL = cam.pickEllipsoid(new Cartesian2(0, 0), Ellipsoid.WGS84);
  // const posLR = cam.pickEllipsoid(new Cartesian2(viewer.canvas.width, viewer.canvas.height), Ellipsoid.WGS84);
  // const posLL = cam.pickEllipsoid(new Cartesian2(0, viewer.canvas.height), Ellipsoid.WGS84);
  // const posUR = cam.pickEllipsoid(new Cartesian2(viewer.canvas.width, 0), Ellipsoid.WGS84);
  //
  // if (posUL) {
  //   // north
  //   let cartographic = ellipsoid.cartesianToCartographic(posUL);
  //   const maxLat = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);
  //
  //
  //   // east
  //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  //   cartographic = ellipsoid.cartesianToCartographic(posUR);
  //   const maxLon = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
  //
  //
  //   // south
  //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  //   cartographic = ellipsoid.cartesianToCartographic(posLR);
  //   const minLat = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);
  //
  //
  //   // west
  //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
  //   cartographic = ellipsoid.cartesianToCartographic(posLL);
  //   const minLon = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
  //
  //   console.log(maxLat, maxLon, minLat, minLon);
  // }
}
