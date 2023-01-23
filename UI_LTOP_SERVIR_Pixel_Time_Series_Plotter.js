//######################################################################################################## 
//#                                                                                                    #\\
//#                             LANDTRENDR PIXEL TIME SERIES PLOTTER GUI                               #\\
//#                                                                                                    #\\
//########################################################################################################


// date: 2018-06-11
// author: Justin Braaten | jstnbraaten@gmail.com
//         Zhiqiang Yang  | zhiqiang.yang@oregonstate.edu
//         Robert Kennedy | rkennedy@coas.oregonstate.edu
//mutator: Peter Clary    | clarype@oregonstate.edu
// website: https://github.com/eMapR/LT-GEE



// import param file 
var params = require('users/clarype/LTOP_QA:params.js')
print(params)
// LandTrendr Mod
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js');  


//####################################################################################
//########### FUNCTIONS ##############################################################
//####################################################################################

//get cluster id from Kmeans image and get the selected parameter for that cluster 
function get_cluster_info(point,img,table){
  // get pixels value -- cluster id
  var pix =  img.reduceRegion({
    reducer: 'first',
    geometry: point,
    scale: 30
  }).getNumber('cluster');
  //print('cluster id from Kmeans image',pix)
  // filter table with pixel value
  var feat = table.filter(ee.Filter.eq('cluster_id', pix))
  //print('look up feature cluster_id',feat.first().get("cluster_id"))
  // return feature info
  return feat
}

// mutate LT parameter feature into dictionary. This dictionary holds the cluster id, and the selected index and parameters.
function get_selected_params(cluster_feat){
  print(cluster_feat)
  var feet = cluster_feat.first().get('params')
  var edit1 = ee.String(feet).replace("=", '":','g')
  var edit2 = edit1.replace("{", '{"','g')
  var edit4 = edit2.replace(", ", ', "','g')
  var edit5 = edit4.replace("<ImageCollection>", '"tass"','g')
  var selected_lt = ee.Dictionary(ee.String(edit5).decodeJSON())
  selected_lt = selected_lt.set("index",cluster_feat.first().get('index'))
  selected_lt = selected_lt.set("cluster_id",cluster_feat.first().get('cluster_id'))
  return selected_lt
}

//This should just be replaced with the correct imageCollection of SERVIR composites 
function buildSERVIRcompsIC(startYear,endYear){
//get the SERVIR composites
  var yr_images = []; 
  for (var y = startYear;y < endYear+1; y++){
    var im = ee.Image("projects/servir-mekong/composites/" + y.toString())//.clip(geometry); 
    yr_images.push(im); 
  }
  var servir_ic = ee.ImageCollection.fromImages(yr_images); 
  
  //it seems like there is an issue with the dates starting on January 1. This is likely the result of a time zone difference between where 
  //the composites were generated and what the LandTrendr fit algorithm expects from the timestamps. 
  servir_ic = servir_ic.map(function(img){
    var date = img.get('system:time_start'); 
    return img.set('system:time_start',ee.Date(date).advance(6,'month').millis()); 
  }); 
return servir_ic; 
}


//This should just be replaced with the correct imageCollection of SERVIR composites 
function buildLTOPcompsIC(startYear,endYear){
//get the SERVIR composites
  var yr_images = []; 
  for (var y = startYear;y < endYear+1; y++){
    var im = ee.Image("users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_" + y.toString()+"_stabilized_reservoir_cambodia_bigger_zoom")//.clip(geometry);
    var bands = im.bandNames()
    yr_images.push(im); 
  }
  var servir_ic = ee.ImageCollection.fromImages(yr_images); 
  
  //it seems like there is an issue with the dates starting on January 1. This is likely the result of a time zone difference between where 
  //the composites were generated and what the LandTrendr fit algorithm expects from the timestamps. 
  servir_ic = servir_ic.map(function(img){
    var date = img.get('system:time_start'); 
    return img.set('system:time_start',ee.Date(date).advance(6,'month').millis()); 
  }); 
return servir_ic; 
}

// function to get LT parameter setting
var getParams = function(){
  var prevOneYrRec = paramBoxes[3].getValue();
  if(typeof(prevOneYrRec) !== "boolean"){
    prevOneYrRec = prevOneYrRec.toLowerCase() != 'false';
  }
  
  return { 
    maxSegments:              parseInt(paramBoxes[0].getValue()),
    spikeThreshold:         parseFloat(paramBoxes[1].getValue()),
    vertexCountOvershoot:     parseInt(paramBoxes[2].getValue()),
    preventOneYearRecovery:                         prevOneYrRec,
    recoveryThreshold:      parseFloat(paramBoxes[4].getValue()),
    pvalThreshold:          parseFloat(paramBoxes[5].getValue()),
    bestModelProportion:    parseFloat(paramBoxes[6].getValue()),
    minObservationsNeeded:    parseInt(paramBoxes[7].getValue())
  };
};

// RETURN LT RESULTS FOR A SINGLE PIXEL AS AN OBJECT
var ltPixelTimeSeries = function(img, pixel) {
  return img.reduceRegion({
   reducer: 'first',
   geometry: pixel,
   scale: 30
  }).getInfo();
};

//var templist = ee.List.repeat(0, 32)
// PARSE OBJECT RETURNED FROM 'getPoint' TO ARRAY OF SOURCE AND FITTED
var ltPixelTimeSeriesArray = function(servir_vert,lt, pixel, indexFlip){
  var pixelTS = ltPixelTimeSeries(lt, pixel);
  var pixelTS_ser = ltPixelTimeSeries(servir_vert, pixel);
  if(pixelTS.LandTrendr === null){pixelTS.LandTrendr = [[0,0],[0,0],[0,0]]}
  var data = [['Year', 'Original', 'Fitted', 'BreakPoint', 'SERVIR_Img_Vert']];
  var len = pixelTS.LandTrendr[0].length;


  var templist = []
  for (var e = 0; e < len; e++) {
    var sercheck = pixelTS_ser["yrs_vert_"+(e).toString()]
    for (var ee = 0; ee < len; ee++) {
      if(sercheck === pixelTS.LandTrendr[0][ee]){templist[pixelTS.LandTrendr[0].indexOf(pixelTS.LandTrendr[0][ee])] = 1}
    }
  }
  
  
  
  //print(templist)
  for (var i = 0; i < len; i++) {


    var ver = pixelTS.LandTrendr[3][i]*pixelTS.LandTrendr[2][i]*indexFlip
    if(ver === 0){
      ver = null;}
    var ser_vert = templist[i]
    if(ser_vert === undefined) {ser_vert = null;}
    
      
    data = data.concat([[pixelTS.LandTrendr[0][i], pixelTS.LandTrendr[1][i]*indexFlip, pixelTS.LandTrendr[2][i]*indexFlip,ver,ser_vert]]);
  }
  return {ts:data, rmse:pixelTS.rmse};
};

// function to create a plot of source and fitted time series
var chartPoint = function(ser,lt, pixel, index, indexFlip, named) {
  var pixelTimeSeriesData = ltPixelTimeSeriesArray(ser,lt, pixel, indexFlip);
  //print(pixelTimeSeriesData)
  //print(named)
  return ui.Chart(pixelTimeSeriesData.ts, 'ComboChart',
            {
              //error//'title' : +named.getInfo()+' Index: '+index + ' | Fit RMSE: '+ (Math.round(pixelTimeSeriesData.rmse * 100) / 100).toString(),
              //NaN//'title' : +ee.String(named).getInfo()+' Index: '+index + ' | Fit RMSE: '+ (Math.round(pixelTimeSeriesData.rmse * 100) / 100).toString(),
              //NaN//'title' : +named+' Index: '+index + ' | Fit RMSE: '+ (Math.round(pixelTimeSeriesData.rmse * 100) / 100).toString(),
              //NaN//'title' : +"Clicked Point"+' Index: '+index + ' | Fit RMSE: '+ (Math.round(pixelTimeSeriesData.rmse * 100) / 100).toString(),
              'title' : named +': Index: '+index + ' | Fit RMSE: '+ (Math.round(pixelTimeSeriesData.rmse * 100) / 100).toString(),
              'hAxis': {'format':'####'},
              'vAxis':{'maxValue': 1000,'minValue': -1000 },
              'series': {
                  //0: {'lineWidth': 12},
                  //1: {'lineWidth': 5,  },
                  2: {'style': 'Scatter', 'pointSize':8, 'lineWith':-1, 'color': 'red'},
                  3: {'style': 'Scatter', 'pointSize':8, 'lineWith':-1, 'color': 'black'},
                }
})};


// function to draw plots of source and fitted time series to panel
var plotTimeSeries = function(x, y){  
  // clear the plot panel
  plotPanel = plotPanel.clear();
  selectedParamplotPanel = selectedParamplotPanel.clear();
  //map.remove(optimized_output)
  
  // get cluster id from cluster image at point and get coorsponding feature with selected landtrendr parameter for that cluster id
  var tab = get_cluster_info( ee.Geometry.Point([x,y]),params.param.kmeans_img,params.param.selected_params)
  // mutate feature collection properties into a dictionary with LT parameters, index and cluster id 
  var selected_lt = get_selected_params(tab)
  print(selected_lt.get("cluster_id"))
  var k_feat = params.param.kmeans_pts.filter(ee.Filter.eq('cluster',selected_lt.get("cluster_id"))).first()
  print('k_feat',k_feat)
  // make mask for cluster_id
  var mask = params.param.kmeans_img.expression(
    "band == "+selected_lt.get("cluster_id").getInfo().toString() +" ? 1 : 0", {
      'band': params.param.kmeans_img.select('cluster'),
  }).not().selfMask();
  
  // make geometry for feature 
  var point_kp = k_feat.geometry()
  var pixel_kp = point_kp.buffer(15).bounds();
  map.layers().set(24, ui.Map.Layer(mask,{},"cluster mask",0))
  map.layers().set(25, ui.Map.Layer(point_kp, {color: 'FF0000'},'ref point'));
  // add a red pixel to the map where the user clicked or defined a coordinate
  var point = ee.Geometry.Point(x, y);
  var pixel = point.buffer(15).bounds();
  map.layers().set(26, ui.Map.Layer(pixel, {color: 'FF0000'},'clicked point'));

  // get the indices that are checked
  var doTheseIndices = [];
  indexBox.forEach(function(name, index) {
    var isChecked = indexBox[index].getValue();
    if(isChecked){
      doTheseIndices.push([indexList[index][0],indexList[index][1]]);
    }
  });

  // make an annual SR collection
  //var annualSRcollection = ltgee.buildSRcollection(startYear, endYear, startDay, endDay, pixel);
  //get servir comps and rename the bands for LandTrendr.js
  var annualSRcollection = buildSERVIRcompsIC(1990,2021).select(['blue','green','red','nir','swir1','swir2'],['B1','B2','B3','B4','B5','B7'])//.geometry()
  // for each selected index, draw a plot to the plot panel
  doTheseIndices.forEach(function(name, index) {
    var annualLTcollection = ltgee.buildLTcollection(annualSRcollection, name[0], []);
    runParams.timeSeries = annualLTcollection;
    var lt = ee.Algorithms.TemporalSegmentation.LandTrendr(runParams);
    
    var chart = chartPoint(params.param.optimized_output, lt, pixel, name[0], name[1], "Clicked Point");
    plotPanel.add(chart);
    
    var chart2 = chartPoint(params.param.optimized_output, lt, pixel_kp, name[0], name[1], "Kmean Rep Point");
    plotPanel.add(chart2);
    

  });

  
  
  var index_selected = ee.String(selected_lt.getString('index')).getInfo()
  var maxSegments_selected = ee.Number(selected_lt.get('maxSegments')).getInfo()
  var spikeThreshold_selected = ee.Number(selected_lt.get('spikeThreshold')).getInfo()
  var vertexCountOvershoot_selected = ee.Number(selected_lt.get('vertexCountOvershoot')).getInfo()
  var preventOneYearRecovery_selected = selected_lt.get('preventOneYearRecovery').getInfo()
  var recoveryThreshold_selected = ee.Number(selected_lt.get('recoveryThreshold')).getInfo()
  var pvalThreshold_selected = ee.Number(selected_lt.get('pvalThreshold')).getInfo()
  var minObservationsNeeded_selected = ee.Number(selected_lt.get('minObservationsNeeded')).getInfo()
  var bestModelProportion_selected = ee.Number(selected_lt.get('bestModelProportion')).getInfo()
  var cluster_k = ee.Number(selected_lt.get('cluster_id')).getInfo()


  //print("selected index", eindex_selected))
  selectedParamplotPanel.add(ui.Label("cluster id: "+cluster_k)) 
  selectedParamplotPanel.add(ui.Label("index: "+index_selected))    
  selectedParamplotPanel.add(ui.Label("maxSegments: "+maxSegments_selected))
  selectedParamplotPanel.add(ui.Label("spikeThresholdspikeThreshold: "+spikeThreshold_selected))
  selectedParamplotPanel.add(ui.Label("vertexCountOvershoot: "+vertexCountOvershoot_selected))
  selectedParamplotPanel.add(ui.Label("preventOneYearRecovery: "+preventOneYearRecovery_selected))
  selectedParamplotPanel.add(ui.Label("recoveryThreshold: "+recoveryThreshold_selected))
  selectedParamplotPanel.add(ui.Label("pvalThreshold: "+pvalThreshold_selected))
  selectedParamplotPanel.add(ui.Label("bestModelProportion: "+bestModelProportion_selected))
  selectedParamplotPanel.add(ui.Label("minObservationsNeeded: "+minObservationsNeeded_selected))

};



//####################################################################################
//########### DEFINE UI COMPONENTS ###################################################
//####################################################################################

// SET UP PRIMARY PANELS
// control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '340px'}
});


// plot panel
var plotsPanelLabel = ui.Label('LandTrendr Time Series Plots', {fontWeight: 'bold', stretch: 'horizontal'});
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotsPanelLabel, plotPanel], null, {width: '480px'});

// selected param panel 
var selectedParamPanelLabel = ui.Label('Selected LandTrendr Parameter and Index', {fontWeight: 'bold', stretch: 'horizontal'});
var selectedParamplotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var selectedParamPanelParent = ui.Panel([selectedParamPanelLabel, selectedParamplotPanel], null, {width: '480px'});

var splitpanel = ui.SplitPanel(selectedParamPanelParent,plotPanelParent,"vertical",false,{ width:'450px'} )
var servir_comp = buildSERVIRcompsIC(1990,2021).select(['blue','green','red','nir','swir1','swir2'],['B1','B2','B3','B4','B5','B7'])//.geometry()
var LTOPcollection = buildLTOPcompsIC(2016,2021)//.select(['blue','green','red','nir','swir1','swir2'],['B1','B2','B3','B4','B5','B7'])//.geometry()

//these are the stabilized composites
var reservoir_2011 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2011_stabilized_reservoir_Cambodia')
var reservoir_2012 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2012_stabilized_reservoir_Cambodia')
var reservoir_2013 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2013_stabilized_reservoir_Cambodia')
var reservoir_2014 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2014_stabilized_reservoir_Cambodia')
var reservoir_2015 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2015_stabilized_reservoir_Cambodia')
var reservoir_2016 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2016_stabilized_reservoir_Cambodia')
var reservoir_2017 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2017_stabilized_reservoir_Cambodia')
var reservoir_2018 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2018_stabilized_reservoir_Cambodia')
var reservoir_2019 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2019_stabilized_reservoir_Cambodia')
var reservoir_2020 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2020_stabilized_reservoir_Cambodia')
var reservoir_2021 = ee.Image('users/ak_glaciers/Cambodia_troubleshooting_tc/cambodia_2021_stabilized_reservoir_Cambodia')


//original servir composites 
var ser_2011 = ee.Image("projects/servir-mekong/composites/2011");
var ser_2012 = ee.Image("projects/servir-mekong/composites/2012");
var ser_2013 = ee.Image("projects/servir-mekong/composites/2013");
var ser_2014 = ee.Image("projects/servir-mekong/composites/2014");
var ser_2015 = ee.Image("projects/servir-mekong/composites/2015");
var ser_2016 = ee.Image("projects/servir-mekong/composites/2016");
var ser_2017 = ee.Image("projects/servir-mekong/composites/2017");
var ser_2018 = ee.Image("projects/servir-mekong/composites/2018");
var ser_2019 = ee.Image("projects/servir-mekong/composites/2019");
var ser_2020 = ee.Image("projects/servir-mekong/composites/2020");
var ser_2021 = ee.Image("projects/servir-mekong/composites/2021");

// map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setOptions('HYBRID');
var processingLabel = ui.Label('Processing, please wait...', {shown:false, position: 'top-center'});
map.add(processingLabel);
//map.addLayer(optimized_output)
map.setCenter(106.3, 13.5, 12);

//map.layers().set(0,ui.Map.Layer(optimized_output,{min:1990,max:2021},"SERVIR Vertex Image",0))
map.layers().set(1,ui.Map.Layer(params.kmeans_img,visKmeansClusters,"Kmeans Image",0))

map.layers().set(2,ui.Map.Layer(reservoir_2011,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2011',0))
map.layers().set(3,ui.Map.Layer(reservoir_2012,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2012',0))
map.layers().set(4,ui.Map.Layer(reservoir_2013,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2013',0))
map.layers().set(5,ui.Map.Layer(reservoir_2014,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2014',0))
map.layers().set(6,ui.Map.Layer(reservoir_2015,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2015',0))
map.layers().set(7,ui.Map.Layer(reservoir_2016,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2016',0))
map.layers().set(8,ui.Map.Layer(reservoir_2017,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2017',0))
map.layers().set(9,ui.Map.Layer(reservoir_2018,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2018',1))
map.layers().set(10,ui.Map.Layer(reservoir_2019,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2019',0))
map.layers().set(11,ui.Map.Layer(reservoir_2020,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2020',0))
map.layers().set(12,ui.Map.Layer(reservoir_2021,{min:0,max:6000,bands:['B5_fit','B4_fit','B3_fit']},'2021',0))

map.layers().set(13,ui.Map.Layer(ser_2011,{min:0,max:6000,bands:['swir1','nir','red']},'2011 ser',0));
map.layers().set(14,ui.Map.Layer(ser_2012,{min:0,max:6000,bands:['swir1','nir','red']},'2012 ser',0));
map.layers().set(15,ui.Map.Layer(ser_2013,{min:0,max:6000,bands:['swir1','nir','red']},'2013 ser',0));
map.layers().set(16,ui.Map.Layer(ser_2014,{min:0,max:6000,bands:['swir1','nir','red']},'2014 ser',0));
map.layers().set(17,ui.Map.Layer(ser_2015,{min:0,max:6000,bands:['swir1','nir','red']},'2015 ser',0));
map.layers().set(18,ui.Map.Layer(ser_2016,{min:0,max:6000,bands:['swir1','nir','red']},'2016 ser',0));
map.layers().set(19,ui.Map.Layer(ser_2017,{min:0,max:6000,bands:['swir1','nir','red']},'2017 ser',0));
map.layers().set(20,ui.Map.Layer(ser_2018,{min:0,max:6000,bands:['swir1','nir','red']},'2018 ser',1));
map.layers().set(21,ui.Map.Layer(ser_2019,{min:0,max:6000,bands:['swir1','nir','red']},'2019 ser',0));
map.layers().set(22,ui.Map.Layer(ser_2020,{min:0,max:6000,bands:['swir1','nir','red']},'2020 ser',0));
map.layers().set(23,ui.Map.Layer(ser_2021,{min:0,max:6000,bands:['swir1','nir','red']},'2021 ser',0));

// index panel
var indexList = [['NBR',-1], ['NDVI',-1], ['EVI',-1], ['NDMI',-1], ['TCB',1], ['TCG',-1],
                 ['TCW',-1], ['TCA' ,-1], ['B1' ,1], ['B2' , 1],
                 ['B3' , 1], ['B4'  ,-1], ['B5'  , 1], ['B7' ,1]];

var indexBox = [];
indexList.forEach(function(name, index) {
  var checkBox = ui.Checkbox(name[0]);
  indexBox.push(checkBox);
});

var indexPanelLabel = ui.Label('Select Indices', {fontWeight : 'bold'});
var indexPanel = ui.Panel(
  [
    ui.Panel([indexBox[0], indexBox[4], indexBox[8], indexBox[12]], null, {stretch: 'horizontal'}),
    ui.Panel([indexBox[1], indexBox[5], indexBox[9], indexBox[13]], null, {stretch: 'horizontal'}),
    ui.Panel([indexBox[2], indexBox[6], indexBox[10]], null, {stretch: 'horizontal'}),
    ui.Panel([indexBox[3], indexBox[7], indexBox[11]], null, {stretch: 'horizontal'})
  ],
  ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}
);

indexBox[0].setValue(1);


// coordinate panel
var coordSectionLabel = ui.Label('Define Pixel Coordinates (optional)',{fontWeight: 'bold'});

var latLabel = ui.Label('Latitude:');
var latBox = ui.Textbox({value:43.7929});
latBox.style().set('stretch', 'horizontal');

var lonLabel = ui.Label('Longitude:');
var lonBox = ui.Textbox({value:-122.8848});
lonBox.style().set('stretch', 'horizontal');

var latLonPanel = ui.Panel(
  [
    coordSectionLabel,
    ui.Panel([lonLabel, lonBox, latLabel, latBox],ui.Panel.Layout.Flow('horizontal'))
  ],
  null,
  {stretch: 'horizontal'}
);


// params panel
var runParams = [
  {label: 'Max Segments:', value: 6},
  {label: 'Spike Threshold:', value: 0.9},
  {label: 'Vertex Count Overshoot:', value: 3},
  {label: 'Prevent One Year Recovery:', value: true},
  {label: 'Recovery Threshold:', value: 0.25},
  {label: 'p-value Threshold:', value: 0.05},
  {label: 'Best Model Proportion:', value: 0.75},
  {label: 'Min Observations Needed:', value: 6},
];

var paramBoxes = [];
var paramPanels = [ui.Label('Define Segmentation Parameters',{fontWeight: 'bold'})];
runParams.forEach(function(param, index){
  var paramLabel = ui.Label(param.label);
  var paramBox = ui.Textbox({value:param.value});
  paramBox.style().set('stretch', 'horizontal');
  var paramPanel = ui.Panel([paramLabel,paramBox], ui.Panel.Layout.Flow('horizontal'));
  paramBoxes.push(paramBox);
  paramPanels.push(paramPanel);
});

var paramPanel = ui.Panel(paramPanels,null,{stretch: 'horizontal'});


// submit panel
var submitButton = ui.Button({label: 'Submit'});
submitButton.style().set('stretch', 'horizontal');






//####################################################################################
//########### BIND FUNCTIONS TO ACTIONS ##############################################
//####################################################################################

// plot time series for clicked point on map
map.onClick(function(coords) {
  var x = coords.lon;
  var y = coords.lat;
  lonBox.setValue(x);
  latBox.setValue(y);
  runParams = getParams();
  plotTimeSeries(x, y);


});


// plot time series for point defined as coordinates
submitButton.onClick(function(){
  var x = parseFloat(lonBox.getValue());
  var y = parseFloat(latBox.getValue());

  runParams = getParams();
  plotTimeSeries(x, y);
  map.setCenter(x, y, 16);
});






//####################################################################################
//########### ADD PANELS TO INTERFACE ################################################
//####################################################################################

//controlPanel.add(yearsPanel);
//controlPanel.add(datesPanel);
controlPanel.add(indexPanelLabel);
controlPanel.add(indexPanel);
controlPanel.add(latLonPanel);
controlPanel.add(paramPanel);
controlPanel.add(submitButton);

map.add(ui.Label({
  value: 'Click a point',
  style: {position: 'top-center'}
}));

map.add(ui.Label({
  value: 'More info',
  style: {position: 'bottom-right'},
  targetUrl: 'https://emapr.github.io/LT-GEE/ui-applications.html#ui-landtrendr-pixel-time-series-plotter'
}));



ui.root.clear();
ui.root.add(controlPanel);
ui.root.add(map);
ui.root.add(splitpanel);

