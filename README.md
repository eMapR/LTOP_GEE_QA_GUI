LTOP_GEE_QA_GUI

This application TOP_GEE_QA_GUI is designed to spot check some of the processing steps in the LandTrendr Optimization workflow. It does so by using Google Earth Engine to display datasets from the workflow, and it shows the pixel time series at a point location for the data.

The application is run from a parameter file that uses these datasets:

	Start year
	End year

KMeans image 
KMeans points      

Selected parameters 
Optimized breakpoints

Fitted imagery directory
Source imagery directory

How to set up the Application 

Edit parameter file
Change the start and end year values on lines 4 and 5 to the values used in the workflow.
Edit each of the file path to point to the correct asset or asset location on lines 
7 - KMeans image
8 - KMeans points
10 - selected parameters 
11 - optimization breakpoints
32 - source imagery location
49  - fitted imagery location
Edit application
Make sure the application is pointing to the correct parameter file location
Run application 

How to use the application 

After clicking the run button the application should display three panels. One on the left (parameters), center (map) and right (plots).

Next, click anyway on the map with the bounds of the datasets. 
This will populate the parameter on the left with the selected parameter for that location. 
Two points will also appear on the map though they may be hard to find. (before looking for them make sure the layers have completely loaded.)

The square location (the left one in the image) is the user clicked location and the round location is the point that was used to determine the parameter that was selected by the optimization. Both of these locations can be seen in the time series form in the panel on the right 

The two charts show the same type of information but for two different locations. The clicked point and the point used in the parameter selection. 
The lines and points in the charts means several things. 
Red line 
Red dots
Black dots 
Blue line 
 
