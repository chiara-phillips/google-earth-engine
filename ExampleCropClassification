//##########################################################################################
//#                        
//#                         EXAMPLE CLASSIFICATION SCRIPT- SENTINEL 2
//#
//##########################################################################################
//
/* 
   date:   1/28/2022
   author: Chiara M. Phillips
   email:  chiara.m.phillips@gmail.com
   notes:  This script uses Sentinel-2 imagery and ocularly sampled points to classify a 
           small region of Zambia into 5 land cover classes. It prints out the area (in hectares)
           of pixels classified as the target crop based on the Random Forest model.
*/


Map.centerObject(region);  

//##########################################################################################
// RESCALE & CLOUDMASK FUNCTIONS
//##########################################################################################
// Rescale Sentinel-2 Bands
function rescalebands(image){
  var t = image.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12']).divide(10000);
  t = t.addBands(image.select(['QA60', 'SCL']));
  var out = t.copyProperties(image);
  return out;
}

// Mask Sentinel-2 for clouds
function maskS2sr(image){
  var qa = image.select('SCL');
  var mask = qa.and(qa.where(qa.eq(1), 0))
    .and(qa.where(qa.eq(2), 0))
    //.and(qa.where(qa.eq(3), 0))
    .and(qa.where(qa.eq(7), 0))
    .and(qa.where(qa.eq(8), 0))
    .and(qa.where(qa.eq(9), 0))
    .and(qa.where(qa.eq(10), 0));
  return image.updateMask(mask);
}

//##########################################################################################
// CREATE IMAGERY COMPOSITE
//##########################################################################################
var S2collection = ee.ImageCollection('COPERNICUS/S2_SR').
  filterDate('2020-08-05', '2020-08-15'). //your imagery dates
  filterBounds(region). //your region of interest
  map(rescalebands).
  map(maskS2sr);

var composite = ee.Image(S2collection.median()).clip(region);
Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], min:0, max:0.3}, 'True Color Composite', true); //visualizing my composite

//##########################################################################################
// TRAINING DATA & PREDICTORS
//##########################################################################################
var bands = ['B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12'];
var samples = Bare.merge(Water).merge(TargetCrop).merge(OtherVeg).merge(OtherAg); //merging together my training samples

//##########################################################################################
// CLASSIFY
//##########################################################################################
// If using spectral signature library, merge with ocularly sampled data below and input merged variable "trainingSamplesfinal" into line 75
//var trainingSamplesfinal = trainingSamples.merge(spectralsignaturelibrary)

var trainingSamples = composite.select(bands).sampleRegions({
  collection: samples,
  properties: ['class'],
  scale: 20
});

// Random Forest
var classifier = ee.Classifier.smileRandomForest(12).train({
  features: trainingSamples, //trainingSamplesfinal
  classProperty: 'class',
  inputProperties: bands
});

var RFclassified = composite.select(bands).classify(classifier);
var vizParams = ['#00ff00' /*lime green other ag*/, 'orange' /*bare*/, 'blue' /*water*/, 'red' /*targetcrop*/,'green' /*green other veg*/]; 
Map.addLayer(RFclassified, {min: 1, max: 5, palette: vizParams}, "RF Classification");

// SVM
var SVMclassifier = ee.Classifier.libsvm({
  kernelType: 'RBF',
  gamma: 0.12,
  cost: 1000
});

var SVMtrained = SVMclassifier.train({
  features: trainingSamples, 
  classProperty:'class', 
  inputProperties: bands 
});

var SVMclassified = composite.select(bands).classify(SVMtrained);
Map.addLayer(SVMclassified, {min: 1, max: 5, palette: vizParams}, 'SVM Classification'); 


//##########################################################################################
// FILTERING AND EXPORTING ASSETS/IMAGERY
//########################################################################################
// Isolate crop of interest, filter out speckles.
var maskCrop = RFclassified.eq(4); //selecting my crop of interest
var Cropselect = RFclassified.updateMask(maskCrop);
var filter = Cropselect.connectedPixelCount(12, true); //only selecting groups of my crop of interest that are 12 pixels or more
var filtermask = filter.gte(12);
var CropFiltered = Cropselect.updateMask(filtermask);
Map.addLayer(CropFiltered, {palette: "red"}, "Filtered Target Crop Pixels Only");

// Calculating target crop area
var area = ee.Image.pixelArea().divide(10000) //convert from meters to hectares
  .updateMask(CropFiltered.select("classification"))
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region,
    scale: 20,
    maxPixels: 9e12
  });
print('Target Crop Area in Hectares ', area);

/*
// Export files to asset or drive as needed
Export.image.toAsset({
  image: CropFiltered,
  description: "ClassificationExample_CropFiltered",
  assetId: "ClassificationExample_CropFiltered",
  scale: 20,
  region: region,
  maxPixels: 6e12
  
});

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: SVMclassified,
  description: 'ClassificationExample',
  scale: 20,
  region: region,
  maxPixels: 6e12
});
*/
