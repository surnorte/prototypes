/**
 * created by Jaime Valencia
 * Modified by zacharymartin on 3/17/15.
 */

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}


function BioFeature(feaLabel){
    this.parentFeature=null;
    this.featureLabel=feaLabel;
    this.description='';
    this.topLeftCoords=-1;
    this.bottomRightCoords=-1;
    this.topLeftValue='';
    this.bottomRightValue='';
    this.relativeToLeftX=-1;
    this.relativeToLeftY=-1;
    this.color='';
    this.typeOfChild=null;  // Data, Range, Unique
    this.bioFeatures=[];

}

var PARSING = 0;
var PLATE = 1;
var FEATURES = 2;

var currentTopLeftCoord = null;
var currentBottomRightCoord = null;

var grid = new Grid("myGrid");

var colorPointer = 0;
var colorPicker = new ColorPicker();
var biofeatures = [];
var matrix = [];
var colsSize =-1;
var rowsSize =-1;
var numberOfFeatures =-1;
var numberOfFeaturesCHILD =-1;
var colorKeyCounter = 0;
var highlightKeys = [];
var examiner = new FileExaminer();

examiner.registerAsLoadListener(function(examiner){
    setDelimiter(examiner.delimiter);
    grid.setData(examiner.matrix);
    grid.fillUpGrid();
    grid.registerSelectedCellCallBack(handleSelectedCells);
    colsSize = examiner.colsSize;
    rowsSize = examiner.rowsSize;
});



function applyFeatures(){

    for(var i = 0; i < biofeatures.length; i++){

        var currentFeature = biofeatures[i];

        var breakLabel = currentFeature.topLeftValue.trim();

        var startPoint = currentFeature.topLeftCoords;
        var endPoint = currentFeature.bottomRightCoords;
        var relativeCol = currentFeature.relativeToLeftX;

        var numOfRows = endPoint[0] - startPoint[0];
        var numOfCols = endPoint[1] - startPoint[1];
        var colorFeature = colorPicker.getColorByIndex(currentFeature.color);

        for(var j = startPoint[0]; j<rowsSize; j++){
            var newLabel = grid.getDataPoint(j,startPoint[1]).trim();

            if(breakLabel == newLabel){
                var coordsToHighlight = [];

                for(var rowIdx = 0; rowIdx<=numOfRows; rowIdx++) {
                    for(var colIdx = 0; colIdx<=numOfCols; colIdx++) {
                        coordsToHighlight.push([rowIdx+j,colIdx + relativeCol]);
                    }
                }
                grid.setCellColors(coordsToHighlight, colorFeature, "key" + colorKeyCounter);
                colorKeyCounter++;


                for(var idxChild = 0; idxChild < currentFeature.bioFeatures.length; idxChild++) {
                    var currentChild = currentFeature.bioFeatures[idxChild];

                    var startPointChild = currentChild.topLeftCoords;
                    var endPointChild = currentChild.bottomRightCoords;
                    var relativeChildCol = currentChild.relativeToLeftX;
                    var relativeChildRow= currentChild.relativeToLeftY;

                    var numOfRowsChild = endPointChild[0] - startPointChild[0];
                    var numOfColsChild = endPointChild[1] - startPointChild[1];
                    var colorFeatureChild
                        = colorPicker.getColorByIndex(currentChild.color);

                    coordsToHighlight = [];
                    for(var rowIdxChild = 0; rowIdxChild<=numOfRowsChild; rowIdxChild++) {
                        for(var colIdxChild = 0; colIdxChild<=numOfColsChild; colIdxChild++) {

                            coordsToHighlight.push([
                                rowIdxChild+relativeChildRow+j,
                                colIdxChild+relativeChildCol+relativeCol
                            ]);
                        }
                    }

                    grid.setCellColors(coordsToHighlight, colorFeatureChild, "key" + colorKeyCounter);
                    colorKeyCounter++;
                }

                j=j+rowIdx-1;
            }
            //console.log("ROwS " + j);
        }

    }
}

$( "#btn-apply-features" ).click(function() {
    applyFeatures();
});

function addFeature(isParent){
    var newFeature = new BioFeature($('#featureLabel').text());
    newFeature.topLeftCoords=currentTopLeftCoord;
    console.log("currentTLC =" + currentTopLeftCoord);
    newFeature.topLeftValue=grid.getDataPoint(currentTopLeftCoord[0], currentTopLeftCoord[1]);
    newFeature.bottomRightCoords=currentBottomRightCoord;
    newFeature.bottomRightValue=grid.getDataPoint(currentBottomRightCoord[0], currentBottomRightCoord[1]);
    newFeature.relativeToLeftX = currentTopLeftCoord[0];
    newFeature.relativeToLeftY = currentTopLeftCoord[1];
    if (isParent) {
        newFeature.typeOfParent = $('input[name=parent-radio]:checked').val();
    } else {
        newFeature.typeOfChild = $('input[name=child-radio]:checked').val();

        // When it is one value set both top and bottom properties to
        // the same value.
        if(newFeature.typeOfChild=='unique'){
            newFeature.bottomRightCoords=newFeature.topLeftCoords;
            newFeature.bottomRightValue=newFeature.topLeftValue;
        }
        newFeature.parentFeature = biofeatures[$("#select-to option:selected").val()];
        newFeature.parentFeature.bioFeatures.push(newFeature);
        newFeature.relativeToLeftX = newFeature.topLeftCoords[1] - newFeature.parentFeature.topLeftCoords[1];
        newFeature.relativeToLeftY = newFeature.topLeftCoords[0] - newFeature.parentFeature.topLeftCoords[0];
        newFeature.importData = true;
    }
    newFeature.color=colorPointer;
    return newFeature;
}


/**
 * replaces anonymous function starting on line 114 of original csvParser.html
 * @param startRow
 * @param startCol
 * @param endRow
 * @param endCol
 */
function handleSelectedCells(startRow, startCol, endRow, endCol){
    selectCells(startRow, startCol, endRow, endCol);

    var plateRangeInput = document.getElementById("firstPlateCellRange");
    plateRangeInput.value = Grid.getRowLabel(startRow)+startCol+":"
    +Grid.getRowLabel(endRow)+endCol;
}

function selectCells(startRow, startCol, endRow, endCol){
    // write to the selected cells div, the cells that are selected
    var out = document.getElementById("selectedCells");
    out.innerHTML = Grid.getRowLabel(startRow)+startCol+":"
    +Grid.getRowLabel(endRow)+endCol;



    // remove previous highlighting
    if (highlightKeys.length){
        grid.removeCellColors(highlightKeys.pop());
    }


    // highlight those cells with the current color
    var coordinatesToHighlight = [];
    for (var i=startRow; i<=endRow; i++){
        for (var j=startCol; j<=endCol; j++){
            coordinatesToHighlight.push([i,j]);
        }
    }
    var key = "key" + colorKeyCounter;
    grid.setCellColors(coordinatesToHighlight,
                       colorPicker.getColorByIndex(colorPointer),
                       "key" + colorKeyCounter);
    highlightKeys.push(key);
    colorKeyCounter++;

    // set the current selected cells variables
    currentTopLeftCoord = [startRow,startCol];
    currentBottomRightCoord = [endRow,endCol];
}


$('#btn-add-child').click(function(){
    $('#select-to-child').append("<option value='"+(numberOfFeaturesCHILD+1)+"'>"+$('#featureLabel').val()+"</option>");
    addFeature(false);
    colorPointer++;
    console.log(biofeatures);
    $('#featureLabel').val('');
});

$('#btn-add').click(function(){
    $('#select-to').append("<option value='"+(numberOfFeatures+1)+"'>"+$('#featureLabel').val()+"</option>");
    biofeatures.push(addFeature(true));
    colorPointer++;
    console.log(biofeatures);
    $('#featureLabel').val('');
});

$('#btn-remove').click(function(){
    $('#select-to option:selected').each( function() {
        $(this).remove();
        numberOfFeatures--;
    });
});


function file2grid(text, lineTerminator, cellTerminator) {

    matrix = [];
    var lines;

    //break the lines apart
    lines = text.split(lineTerminator);
    rowsSize = lines.length;

    for(var j = 0; j<rowsSize; j++){

        var information = lines[j].split(cellTerminator);

        if (information.length > colsSize){
            colsSize = information.length;
        }

        matrix[j] = [];
        for(var k = 0; k < information.length; k++){
            matrix[j][k] = information[k];
        }
    }


}


function handleFileSelect(event) {
    var files;
    var fileNameDisplayElement = document.getElementById("selectedFile");

    if (event.target && event.target.files){
        // file input case
        files = event.target.files; // FileList object
    } else if (event.dataTransfer && event.dataTransfer.files) {
        // drag and drop case
        files = event.dataTransfer.files;
    }

    // reset parser
    currentTopLeftCoord = null;
    currentBottomRightCoord = null;


    colorPointer = 0;
    biofeatures = [];
    matrix = [];
    lines = [];
    colsSize =-1;
    rowsSize =-1;
    numberOfFeatures =-1;
    numberOfFeaturesCHILD =-1;

    fileNameDisplayElement.innerHTML = files[0].name;
    examiner.setFile(files[0]);

}

function changeDelimiter(){
    var delimiter = document.getElementById("delimiterList").value;
    examiner.reExamineWithDelimiter(delimiter);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function handleGetFile(){
    $("#files").click();
}

function setDelimiter(delimiter){
    var element = document.getElementById("delimiterList");
    element.value = delimiter;

}

// Attach listener for when a file is first dragged onto the screen
document.addEventListener('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();

    // Show an overlay so it is clear what the user needs to do
    document.body.classList.add('show-overlay');
}, false);

// Attach a listener for while the file is over the browser window
document.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
}, false);

// Attach a listener for when the file is actually dropped
document.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();

    // Hides the overlay
    //document.body.classList.remove('show-overlay');

    // Process the files
    handleFileSelect(e);

}, false);

function firstPlateCellRangeChange(){
    var plateRangeInput = document.getElementById("firstPlateCellRange");
    var range = plateRangeInput.value.trim();
    var rangeSplit = range.split(":");
    var start = rangeSplit[0].trim();
    var end = rangeSplit[1].trim();
    start = Grid.getCellCoordinates(start);
    end = Grid.getCellCoordinates(end);
    selectCells(start[0]-1, start[1], end[0]-1, end[1]);
}

function searchForPlateInvariates(){
    var valueToLookFor;
    var timesFound;
    var possibleInvariateCoords = [];
    var threshold
        = Math.floor(rowsSize/((currentBottomRightCoord[0] - currentTopLeftCoord[0])*2));

    for(var row=currentTopLeftCoord[0]; row<=currentBottomRightCoord[0]; row++){
        for(var col=currentTopLeftCoord[1]; col<=currentBottomRightCoord[1]; col++){
            valueToLookFor = grid.getDataPoint(row, col).trim();
            if (valueToLookFor){
                timesFound = 0;
                for(var obsRow = currentBottomRightCoord[0]+1; obsRow<=rowsSize; obsRow++){
                    var currentValue = grid.getDataPoint(obsRow, col);
                    if (currentValue && currentValue.trim() == valueToLookFor){
                        timesFound++;
                        if (timesFound >= threshold) {

                            possibleInvariateCoords.push([row,col]);
                            break;
                        }
                    }

                }


            }
        }
    }

    grid.setCellColors(possibleInvariateCoords, "#a00", "invariates");

    // load invariate cell selector
    var invariateSelectElement = document.getElementById("invariateSelect");
    for (var i=0; i<possibleInvariateCoords.length; i++){
        var cellRow = possibleInvariateCoords[i][0] + 1;
        var cellCol = possibleInvariateCoords[i][1];
        var cellValue = grid.getDataPoint(cellRow, cellCol);
        var optionValue = cellRow+":"+ cellCol;

        var option = document.createElement("option");
        option.setAttribute("value", optionValue);
        option.innerHTML = cellValue + " : " + Grid.getRowLabel(cellRow) + cellCol;
        invariateSelectElement.appendChild(option);
    }
}

/**
 * This function returns the active tab, to be compared with the constants:
 *      PARSING
 *      PLATE
 *      FEATURES
 * @returns {*|jQuery}
 */
function getActiveTab(){
    return $("#tabs").tabs( "option", "active" );
}

/**
 * addEvent - This function adds an event handler to an html element in
 * a way that covers many browser types.
 * @param elementId - the string id of the element to attach the handler to
 * or a reference to the element itself.
 * @param eventType - a string representation of the event to be handled
 * without the "on" prefix
 * @param handlerFunction - the function to handle the event
 */
function addEvent(elementId, eventType, handlerFunction) {
    'use strict';

    var element;

    if (typeof(elementId) === "string"){
        element = document.getElementById(elementId);
    } else {
        element = elementId;
    }

    if (element.addEventListener) {
        element.addEventListener(eventType, handlerFunction, false);
    } else if (window.attachEvent) {
        element.attachEvent("on" + eventType, handlerFunction);
    }
} // end of function addEvent

/**
 * This function handles the window load event. It initializes and fills the
 * grid with blank data and sets up the event handlers on the
 */
function init(){

    addEvent("firstPlateCellRange", "change", firstPlateCellRangeChange);
    addEvent("applyFirstPlate", "click", searchForPlateInvariates);
    addEvent("getFile", "click", handleGetFile);
    addEvent("delimiterList", "change", changeDelimiter);

    // to get jQuery-UI tab functionality working
    $( "#tabs" ).tabs({
        active: 0
    });
}

window.onload = init;

