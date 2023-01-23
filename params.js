var param = {};

//start year 
param.startYear = 2011
param.endYear = 2021

param.kmeans_img = ee.Image('projects/ee-ltop-py/assets/LTOP_py_Cambodia_200/LTOP_KMEANS_cluster_image_20000_pts_200_max_200_min_clusters_Cambodia_200_c2_1990')
param.kmeans_pts = ee.FeatureCollection('projects/ee-ltop-py/assets/LTOP_py_Cambodia_200/LTOP_KMEANS_stratified_points_200_max_200_min_clusters_Cambodia_200_c2_1990')

param.selected_params = ee.FeatureCollection('projects/ee-ltop-py/assets/LTOP_py_Cambodia_200/LTOP_Cambodia_200_selected_LT_params_tc')
param.optimized_output = ee.Image('projects/ee-ltop-py/assets/LTOP_py_Cambodia_200/Optimized_LT_1990_start_Cambodia_200_all_cluster_ids_tc')

// make time series sequence 
var timelist = []
var yr = param.startYear
var cnt = 0
while (yr <= param.endYear){
  //print(yr)
  timelist[cnt]=yr.toString()
  yr += 1
  cnt += 1 
}

// empty list -- this list will be populated with images 
param.servirComplist = []

// counter -- this counter is used as an index for applying images to the empty list
var count = 0

for (var i in timelist){
  //get image
  var servirComp = ee.Image("projects/servir-mekong/composites/"+timelist[i]).select(['swir1','nir','red']); 
  // add image to list 
  param.servirComplist[count]= servirComp
  // add 1 to the counter
  count+=1
}

param.servirStack = ee.ImageCollection(param.servirComplist).map(function(img){var yr = img.get('year'); return img.set('system:index', yr.toString())})

// empty list -- this list will be populated with images 
param.ltopCompList = []

// counter -- this counter is used as an index for applying images to the empty list
var count2 = 0

for (var ii in timelist){
  //get image
  var ltopComp = ee.Image("users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_"+timelist[ii]+"_stabilized_reservoir_Cambodia");
  // add image to list 
  param.ltopCompList[count2]= ltopComp
  // add 1 to the counter
  count2+=1
}

param.ltopStack = ee.ImageCollection(param.ltopCompList).map(function(img){var yr = img.get('year'); return img.set('system:index', yr.toString())})



exports.param = param;
