## The Naming Convention for the Borelogs

#### Each borelog and it's file shall be Identified with a 48 character string
    The first 30 Characters would refer to the Name of the Borelog as specified by the user/uploader, e.g., PL-0879-BH-1-PAC0E9-xxxxxxxxxx
        If the Name of the Borelog is greater than 30 characters the last characters will be trimmed off.
        If the Name of the Borelog is smaller than 30 characters then random alphanumeric characters, with a leading '-', will be added to it to make it a 30 character name.
    The next 8 characters joined by a hyphen will be the data of the uploading, dd/mm/YYYY, e.g., 19092026
    The next 8 characters joined by a hyphen to the earlier string will be an 8 character alpha-numeric identifier, e.g., 03ADiPcY

#### Resulting name: `PL-0879-BH-1-PAC0E9-xxxxxxxxxx-19092026-03ADiPcY`
The resulting name will serve as the UID of the feature and it's corresponding file. 

#### The format may either be .JSON or XLSX or.pdf. 
There will be an attribute `f_file` where the file name along with the format would be stored. Therefore the string length along with the format would be:
    for the JSON and the XLSX files 48 + 2 (hyphenations) + {5} (.JSON) = 55 and 
    for PDF files 48 + 2 (hyphenations) + 4 (.PDF) = 54.
    
> It is highly recommended that the f_file field is set to be at least 56 characters long string.

Whenever a new borelog is submitted via the form:
    The `UID` of the will be sourced from the Borelog Name first.
        Naming the borelog:
            If the borelog less than 30 characters the remaining numbers of characters will be filled by rando, alphanumeric characters with a leading '-'.
            If the borelog more than 30 characters the first 30 characters will be taken and the remaining would be trimmed off.
    Next, the 8 character date of the day and an 8 character alphanumeric random string is built. 
    This strings will be joined together in 2 ways.
        First they will be joined plainly and will thus form the `borelog_id`.
        Secondly they will be joined with a '-' between them and will be added to the 30 character name string. The resulting string would be the `UID` for the borelog feature.  
    **Care must be taken so that there's no duplication of UIDs.**
> The `UID` is a unique string. It is `48` characters long.
    If a duplicate is found then the process of generating the 8 random alphanumeric characters will be regenerated so as to build a unique `UID` string, until the string becomes unique enough for a `UID`.

### Thus the borelog is submitted and awaits for approval.

## Once the Webmaster approves a borelog
The feature along with its attributes will be added to the Appended Borelogs layer. If any of the attribute cannot be mapped then a prompt window will come asking the Webmaster to input the attributes manually for whichever attribute that could not be matched. 

When the borelog is approved it is unlikely that the `UID` will be the same. However, if there is any duplication then the final 8 random alphanumeric characters will be replace by a regenerated and applied until the `UID` becomes unique. The borelog files moves to the borelogs/published directory from the borelogs/staged directory.

### Let's just see what's in the Appended Borelogs Layer
    - The essential attributes: UID, f_file, keys
    - The f_class_color if not given explicitly will be #3b82f6
    - The keys attribute will be: [Name, Place], [xcoord, Easting], [ycoord, Northing], [f_file, See Details] 
    - The xcoord and the ycoord will be the longitude and latitude in EPSG 4326: They will be taken up from the form and put into the borelog feature. 