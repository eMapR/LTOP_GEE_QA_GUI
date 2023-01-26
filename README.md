### TOP_GEE_QA_GUI

This application **TOP_GEE_QA_GUI** is designed to spot check some of the processing steps in the LandTrendr Optimization workflow. It does so by using Google Earth Engine to display datasets from the workflow, and it shows the pixel time series at a point location for the data.
The application is run from a parameter file that uses these datasets and parameters:

1. Start year
2. End year
3. KMeans image 
4. KMeans points   
5. Selected parameters 
6. Optimized breakpoints
7. Fitted imagery directory
8. Source imagery directory

#### How to set up the Application 

1. Edit parameter file

   1. Change the start and end year values on lines 4 and 5 to the values used in the workflow. Edit each of the file path to point to the correct asset or asset location on lines. 

      - 7  - KMeans image

      - 8 -  KMeans points

      - 10 - Selected parameters 

      - 11 - optimization breakpoints

      - 32 - source imagery location

      - 49 - fitted imagery location

2. Edit application
   1. Make sure the application is pointing to the correct parameter file location 
3. Run application 

#### How to use the application 

1. After clicking the run button the application should display three panels. One on the left (parameters), center (map) and right (plots).

   ![img](https://lh6.googleusercontent.com/MPp64C37qO75cVovtCfBOM_QybqrfFsyfm2sL7pN70-RuNCbDZ-BX9MNsdNjW5o_jAkJXjbtzMtraHi7l8SNSGoTjY-E37cWXIroYJP_tTXvwyxLquUgpA2WWMHL3QQlV2L8-Gbse1c1Zxpkiq4xWyqzcJtu1cDoQlq3DDbDIrNshIzA9kPeCdpZsgnz1w)

2. Next, click anyway on the map with the bounds of the datasets. 

   1. This will populate the parameter on the left with the selected parameter for that location.

   2. Two points will also appear on the map though they may be hard to find. (before looking for them make sure the layers have completely loaded.)

      ![img](https://lh6.googleusercontent.com/ZUpT6C9IsHg_Ks8AQLkLrsOpwL3ZSfNmpL0CxI6CdlFSd8-WzswmU9O2FMFWFaMPx_K4ktKkvmUJv8toOAojxX7IUziaLA6B055q07VFWYJLMLAiAO816TqVqfMB-wRAJgZt0C3f0GlhGCJIdd8LtYuMFJxv2qsA03E-VwgDHSFSMBijw7aAZ3gZ_fOw3Q)

   3. The square location (the left one in the image) is the user clicked location and the round location is the point that was used to determine the parameter that was selected by the optimization. Both of these locations can be seen in the time series form in the panel on the right.

      ![img](https://lh3.googleusercontent.com/JriTGiDBT_ip7sT-qLDCHZZ64TZv2M7YW75qvJjvVpOat6wWFxzdCEpdyCDOW9ld1B7u09O1sOJzUDHrswAdtJNcLi2DsADYuJ3iRisUrQwGz_XrqYZ2g8c3XHLCCo4WO8fBwozaU-nz-DVTBuFOy-qzxw6VnEtMDzejzNK6GJaJP1XiSG8nZXu4xAiHPA)

   4.  The two charts show the same type of information but for two different locations. The clicked point and the point used in the parameter selection. The lines and points in the charts means several things. 

      1. Red line 
      2. Red dots 
      3. Black dots 
      4. Blue line 
