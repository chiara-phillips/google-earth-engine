//##########################################################################################
//#                        
//#                         PROVINCE-LEVEL PIXEL CALCULATOR
//#
//##########################################################################################
//
/* 
   date:   1/12/2022
   author: Chiara M. Phillips
   email:  chiara.m.phillips@gmail.com
   notes:  This script uses GADM's Zimbabwe Level-1 Shapefile and an exported filtered
           classification output to calulate the number of pixels of a class of interest
           across all provinces of interest.
*/


Map.centerObject(image);  

// Function to create a province-level filter based on GADM HASC code
function filterprov(hasc){
  var filter = ee.Filter.inList('HASC_1', [hasc]);
  var prov = table.filter(filter);
  return prov;
}


// Function that clips classification (image) to province variable (filter).
function clipclass(imageINPUT, filter){
  return imageINPUT.clip(filter);
}

// HASC Codes for provinces I'm interested in
var hasccodes = ['ZW.MW', 'ZW.MC', 'ZW.ME', 'ZW.MI', 'ZW.MA', 'ZW.MS', 'ZW.MN', 'ZW.MV']; 

// Prints out pixel count for every province
for (var t=0;t<hasccodes.length;t++){
  var filtered_province = filterprov(hasccodes[t]);
  var filtered_classif = clipclass(image, filtered_province);
  var count = filtered_classif.select("classification").reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: table,
    scale: 20,
    maxPixels: 4e12
  });
  print(hasccodes[t], count);

}

// Adds image to map
Map.addLayer(image, {palette: "red"}, "Crop");
