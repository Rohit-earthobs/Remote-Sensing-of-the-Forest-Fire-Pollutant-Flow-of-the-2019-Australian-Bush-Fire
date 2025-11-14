/*
================================================================================
REMOTE SENSING OF FOREST FIRE POLLUTANT FLOW - 2019 AUSTRALIAN BUSH FIRES
================================================================================

Based on the research paper:
"Remote Sensing of the Forest Fire Pollutant Flow of the 2019 Australian Bush Fire"
Authors: P Rohit, S Mira Shivani, Alka Singh
Published in: 2023 IEEE India Geoscience and Remote Sensing Symposium (InGARSS)
Conference Date: 10-13 December 2023
Conference Location: Bangalore, India
Date Added to IEEE Xplore: 09 April 2024
DOI: 10.1109/InGARSS59135.2023.10490389
Publisher: IEEE

ABSTRACT:
Eastern Australia is one of the most fire-prone regions globally. This study 
analyzes Forest Fire Pollutants (FFP) from the 2019 Australian bush fires using 
remote sensing data. The analysis focuses on carbon monoxide (CO), nitrogen dioxide 
(NO2), and particulate matter (PM) generated from forest fires. Due to global wind 
patterns, FFP can travel long distances, remain suspended in the atmosphere, and 
impact different earth system processes.

STUDY PERIOD: December 15, 2019 to January 10, 2020 (Peak Fire Period)
TIME SERIES ANALYSIS: 2019-2020 (24 months)
STUDY AREA: Australian Bushfire Region (New South Wales/Victoria)

DATASETS USED:
- Sentinel-5P: CO and NO2 atmospheric concentrations
- Sentinel-5P: Aerosol Index
- Landsat 8 Collection 2: Fire visualization
- MODIS: Fire Radiative Power and fire points

================================================================================
*/

// Define the Area of Interest (AOI) and Region of Interest (ROI)
var roi = aoi;
var geometry = aoi;

// Center the map on the study area
Map.centerObject(roi, 7);

// Define Sentinel-5P collections for atmospheric pollutants
var no2 = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2");
var co = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CO");

// Fire period dates (Peak of Australian bushfires)
var fireStart = '2019-12-15';
var fireEnd = '2020-01-10';

//////////////////////////////////////////////////////////////////////////////////
// PART 1: SENTINEL-5P CARBON MONOXIDE (CO) TIME SERIES ANALYSIS (2019-2020)
//////////////////////////////////////////////////////////////////////////////////
/*
Carbon Monoxide is a key pollutant released during forest fires. It is a 
colorless, odorless gas that can travel long distances in the atmosphere.
This section analyzes monthly CO concentrations over a 2-year period to 
observe the spike during the bushfire period.
*/

var timeSeriesStart = '2019-01-01';
var timeSeriesEnd = '2024-12-31';

// Load the Sentinel-5P CO data collection
var co_collection = ee.ImageCollection(co)
  .filterBounds(aoi)
  .filterDate(timeSeriesStart, timeSeriesEnd);

// Create a list of 24 months (January 2019 to December 2020)
var months = ee.List.sequence(0, 23);

// Map over the months list to extract monthly CO data
var monthlyCO = months.map(function(month) {
  var year = ee.Number(month).divide(12).floor().add(2019);
  var monthOfYear = ee.Number(month).mod(12).add(1);
  var monthStart = ee.Date.fromYMD(year, monthOfYear, 1);
  var monthEnd = monthStart.advance(1, 'month');
  
  // Filter CO data for the current month
  var filtered = co_collection.filterDate(monthStart, monthEnd);
  var meanCO = filtered.mean().select('CO_column_number_density');
  
  // Calculate mean CO concentration for the AOI
  var monthlyCOValue = meanCO.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 5000,  // 5km resolution to reduce computation
    bestEffort: true,
    maxPixels: 1e8
  }).get('CO_column_number_density');
  
  return monthlyCOValue;
});

// Create month labels in YYYY-MM format
var monthLabels = months.map(function(month) {
  var year = ee.Number(month).divide(12).floor().add(2019);
  var monthOfYear = ee.Number(month).mod(12).add(1);
  var monthString = ee.String(year.format('%d')).cat('-').cat(monthOfYear.format('%02d'));
  return monthString;
});

// Convert to dictionary for charting
var monthlyCO_dict = ee.Dictionary.fromLists(monthLabels, monthlyCO);

// Create a feature collection for the chart
var co_features = monthlyCO_dict.map(function(key, value) {
  var month = ee.String(key);
  var co_value = ee.Number(value);
  var feature = ee.Feature(null, { month: month, co: co_value });
  return feature;
});

var co_featureCollection = ee.FeatureCollection(co_features.values());

// Create CO time series chart
var coChart = ui.Chart.feature.byFeature(co_featureCollection, 'month', ['co'])
  .setChartType('LineChart')
  .setOptions({
    title: 'Sentinel-5P: CO Levels During Australian Bushfires (2019-2020)',
    hAxis: { 
      title: 'Month',
      slantedText: true,
      slantedTextAngle: 45
    },
    vAxis: { title: 'CO Level (mol/m²)' },
    lineWidth: 2,
    pointSize: 5,
    series: {
      0: { color: 'blue' },
    },
    legend: { position: 'none' }
  });

print('=== CO TIME SERIES CHART ===');
print(coChart);

//////////////////////////////////////////////////////////////////////////////////
// PART 2: SENTINEL-5P NITROGEN DIOXIDE (NO2) TIME SERIES ANALYSIS (2019-2020)
//////////////////////////////////////////////////////////////////////////////////
/*
Nitrogen Dioxide (NO2) is another important pollutant released during combustion.
It contributes to air quality degradation and can form secondary pollutants.
This section analyzes monthly NO2 concentrations over the same 2-year period.
*/

// Load the Sentinel-5P NO2 data collection
var no2_collection = ee.ImageCollection(no2)
  .filterBounds(aoi)
  .filterDate(timeSeriesStart, timeSeriesEnd);

// Map over the months list to extract monthly NO2 data
var monthlyNO2 = months.map(function(month) {
  var year = ee.Number(month).divide(12).floor().add(2019);
  var monthOfYear = ee.Number(month).mod(12).add(1);
  var monthStart = ee.Date.fromYMD(year, monthOfYear, 1);
  var monthEnd = monthStart.advance(1, 'month');
  
  // Filter NO2 data for the current month
  var filtered = no2_collection.filterDate(monthStart, monthEnd);
  var meanNO2 = filtered.mean().select('NO2_column_number_density');
  
  // Calculate mean NO2 concentration for the AOI
  var monthlyNO2Value = meanNO2.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 5000,  // 5km resolution to reduce computation
    bestEffort: true,
    maxPixels: 1e8
  }).get('NO2_column_number_density');
  
  return monthlyNO2Value;
});

// Convert to dictionary for charting
var monthlyNO2_dict = ee.Dictionary.fromLists(monthLabels, monthlyNO2);

// Create a feature collection for the chart
var no2_features = monthlyNO2_dict.map(function(key, value) {
  var month = ee.String(key);
  var no2_value = ee.Number(value);
  var feature = ee.Feature(null, { month: month, no2: no2_value });
  return feature;
});

var no2_featureCollection = ee.FeatureCollection(no2_features.values());

// Create NO2 time series chart
var no2Chart = ui.Chart.feature.byFeature(no2_featureCollection, 'month', ['no2'])
  .setChartType('LineChart')
  .setOptions({
    title: 'Sentinel-5P: NO2 Levels During Australian Bushfires (2019-2020)',
    hAxis: { 
      title: 'Month',
      slantedText: true,
      slantedTextAngle: 45
    },
    vAxis: { title: 'NO2 Level (mol/m²)' },
    lineWidth: 2,
    pointSize: 5,
    series: {
      0: { color: 'green' },
    },
    legend: { position: 'none' }
  });

print('=== NO2 TIME SERIES CHART ===');
print(no2Chart);

//////////////////////////////////////////////////////////////////////////////////
// PART 3: SENTINEL-5P CO SPATIAL DISTRIBUTION (FIRE PERIOD)
//////////////////////////////////////////////////////////////////////////////////
/*
This section visualizes the spatial distribution of Carbon Monoxide during
the peak fire period (December 15, 2019 to January 10, 2020).
Higher concentrations indicate active fire regions and smoke plume transport.
*/

var collection_CO_fire = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')
  .filterBounds(roi)
  .filterDate(fireStart, fireEnd)
  .mean();

var clip_CO = collection_CO_fire.clip(roi);

// Visualization parameters for CO (mol/m²)
var co_viz = {
  min: 0,
  max: 0.05,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

Map.addLayer(clip_CO, co_viz, 'S5P CO (Fire Period)', true, 0.7);

//////////////////////////////////////////////////////////////////////////////////
// PART 4: SENTINEL-5P NO2 SPATIAL DISTRIBUTION (FIRE PERIOD)
//////////////////////////////////////////////////////////////////////////////////
/*
This section visualizes the spatial distribution of Nitrogen Dioxide during
the peak fire period. NO2 levels can indicate combustion intensity and 
atmospheric chemistry changes during the fires.
*/

var collection_NO2_fire = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')
  .select('NO2_column_number_density')
  .filterBounds(roi)
  .filterDate(fireStart, fireEnd)
  .mean();

var clip_NO2 = collection_NO2_fire.clip(roi);

// Visualization parameters for NO2 (mol/m²)
var no2_viz = {
  min: 0,
  max: 0.0002,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

Map.addLayer(clip_NO2, no2_viz, 'S5P NO2 (Fire Period)', false, 0.7);

//////////////////////////////////////////////////////////////////////////////////
// PART 5: SENTINEL-5P AEROSOL INDEX (PARTICULATE MATTER PROXY)
//////////////////////////////////////////////////////////////////////////////////
/*
The Absorbing Aerosol Index (AAI) is a proxy for particulate matter (PM) and 
smoke aerosols. Positive AAI values indicate the presence of absorbing aerosols
like smoke from biomass burning. This is crucial for tracking the spatial extent
and transport of smoke plumes from the bushfires.
*/

var sentinel5p_aer = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_AER_AI')
  .select('absorbing_aerosol_index')
  .filterDate('2019-12-01', fireEnd)
  .filterBounds(geometry)
  .mean();

// Visualization parameters for Aerosol Index
var aer_viz = {
  min: -1,
  max: 3.0,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

var sent_aer = sentinel5p_aer.clip(geometry);
Map.addLayer(sent_aer, aer_viz, 'S5P Aerosol Index', true, 0.7);

//////////////////////////////////////////////////////////////////////////////////
// PART 6: LANDSAT 8 FIRE IMAGERY
//////////////////////////////////////////////////////////////////////////////////
/*
Landsat 8 provides high-resolution (30m) optical imagery for fire visualization.
The False Color composite (SWIR, NIR, Red) enhances active fires and burn scars,
making it easier to identify affected areas.
*/

// Define Landsat 8 Collection 2
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');

// Filter Landsat 8 for fire period (cloud cover < 30%)
var landsatFire = l8.filterDate(fireStart, fireEnd)
  .filterBounds(roi)
  .filterMetadata('CLOUD_COVER', 'LESS_THAN', 30);

// Function to apply scaling factors for Collection 2 Level 2 products
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

// Apply scaling to all images
var landsatFireScaled = landsatFire.map(applyScaleFactors);

// Visualize RGB (True Color: Red, Green, Blue bands)
Map.addLayer(landsatFireScaled.median().clip(roi), 
  {min: 0, max: 0.3, bands: ['SR_B4', 'SR_B3', 'SR_B2']}, 
  'Landsat 8 RGB', false);

// Visualize False Color (SWIR-NIR-Red: Good for fire and burn scar detection)
// Active fires appear bright red/orange, burn scars appear dark
Map.addLayer(landsatFireScaled.median().clip(roi), 
  {min: 0, max: 0.5, bands: ['SR_B7', 'SR_B6', 'SR_B4']}, 
  'Landsat 8 False Color (Fire)', true);

print('Landsat 8 Image Count:', landsatFire.size());

//////////////////////////////////////////////////////////////////////////////////
// PART 7: MODIS FIRE DATA - FIRE RADIATIVE POWER (FRP)
//////////////////////////////////////////////////////////////////////////////////
/*
MODIS provides daily fire detection at 1km resolution. Maximum Fire Radiative 
Power (MaxFRP) indicates the intensity of thermal emissions from fires, measured 
in MW (megawatts). Higher FRP values indicate more intense fires. This data helps
identify active fire locations and their relative intensities.
*/

var modisFire = ee.ImageCollection("MODIS/006/MOD14A1")
  .filterDate(fireStart, fireEnd)
  .select("MaxFRP")
  .filterBounds(roi)
  .max();

var modisFire_roi = modisFire.clip(roi);

// Visualize fire points (binary: fire detected or not)
Map.addLayer(modisFire_roi.gt(0), {palette: "red"}, "MODIS Fire Points", true);

// Visualize fire intensity (graduated scale)
var frp_viz = {
  min: 0,
  max: 500,
  palette: ['yellow', 'orange', 'red', 'darkred']
};
Map.addLayer(modisFire_roi, frp_viz, 'MODIS Fire Radiative Power', false);

//////////////////////////////////////////////////////////////////////////////////
// SUMMARY AND OUTPUTS
//////////////////////////////////////////////////////////////////////////////////

print('=== SUMMARY ===');
print('Study Area: Australian Bushfire Region (New South Wales/Victoria)');
print('Fire Period: December 15, 2019 to January 10, 2020');
print('Time Series Period: 2019-2020 (24 months)');
print('AOI Coordinates:', aoi.coordinates());
print('');
print('RESEARCH CONTEXT:');
print('This analysis is based on the IEEE InGARSS 2023 paper:');
print('"Remote Sensing of the Forest Fire Pollutant Flow of the 2019 Australian Bush Fire"');
print('Authors: P Rohit, S Mira Shivani, Alka Singh');
print('');
print('KEY FINDINGS:');
print('- Charts show CO and NO2 levels over 2-year period');
print('- Fire period (Dec 2019 - Jan 2020) shows elevated CO levels');
print('- FFP can travel long distances due to global wind patterns');
print('- Remote sensing effectively traces the movement of Forest Fire Pollutants');
print('');
print('DATASETS ANALYZED:');
print('1. Sentinel-5P: Carbon Monoxide (CO)');
print('2. Sentinel-5P: Nitrogen Dioxide (NO2)');
print('3. Sentinel-5P: Aerosol Index (PM proxy)');
print('4. Landsat 8: High-resolution fire imagery');
print('5. MODIS: Fire Radiative Power and fire points');

/*
================================================================================
END OF SCRIPT
================================================================================
For more information, refer to:
DOI: 10.1109/InGARSS59135.2023.10490389
IEEE Xplore: https://ieeexplore.ieee.org/

================================================================================
*/
