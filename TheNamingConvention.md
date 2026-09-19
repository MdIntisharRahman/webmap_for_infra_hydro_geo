## The Naming Convention for the Borelogs

#### Each borelog and it's file shall be Identified with a 32 character string
    The first 14 Characters would refer to the Name of the Borelog as specified by the user/uploader, e.g., PL-0879-PAC0E9
        If the Name of the Borelog is greater than 14 characters the last characters will be trimmed off.
        If the Name of the Borelog is smaller than 14 characters 'x' characters will be added to it to make it a 14 character name.
    The next 8 characters joined by a hyphen will be the data of the uploading, dd/mm/YYYY, e.g., 19092026
    The next 8 characters joined by a hyphen to the earlier string will be an 8 character alpha-numeric identifier, e.g., 03ADiPcY

#### Resulting name: `PL-0879-PAC0E9-19092026-03ADiPcY`
The resulting name will serve as the UID of the feature and it's corresponding file. 

#### The format may either be .JSON or .pdf. 
There will be an attribute `f_file` where the file name along with the format would be stored. Therefore the string length along with the format would be at least 32+4 + {5} = 41.

Whenever a new borelog is submitted via the form:
    The `Borehole ID` of the form is taken for the Borelog Name. 
        If it's less than 14 characters the remaining numbers of characters will be filled by 'x'
        If it's more than 14 characters the first 14 characters will be taken and the remaining would be trimmed off.
    Next The 8 character date and an 8 character alphanumeric random string is assigned and added to build up an `UID` and name as well. **Care must be taken so that there's no duplication of names.**
    The `UID` attribute will be filled as planned. 
### Thus the borelog is submitted and awaiting approval.

## Once the Webmaster approves a borelog
The feature along with its attributes will be added to the Appended Borelogs layer. If any of the attribute cannot be mapped then a prompt window will come asking the Webmaster to input the attributes manually for whichever attribute that could not be matched. 
The borelog files moves to the borelogs/published directory from the borelogs/staged directory.

### Let's just see what's in the Appended Borelogs Layer
    - The essential attributes: UID, f_file, keys
    - The f_class_color if not given explicitly will be #3b82f6
    - The keys attribute will be: [Name, Place], [xcoord, Easting], [ycoord, Northing], [f_file, See Details] 
    - The xcoord and the ycoord will be the longitude and latitude in EPSG 4326: They will be taken up from the form and put into the borelog feature. 