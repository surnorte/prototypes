/**
 * Created by zacharymartin on 3/19/15.
 */

// Some constants for row letter labeling
var ROW_HEAD_BASE = 26;
var STARTING_CHAR_CODE = 65;

/**
 * Grid Objects! The constructor takes the id of the container element in which the grid
 * will be displayed, this element is most likely a div and must have its dimensions
 * specified along the lines of
 * @param containerID
 * @constructor
 */
function Grid(containerID){
    var _self = this;
    this.matrix = null;
    this.data = null;
    this.colsSize =-1;
    this.rowsSize =-1;
    this.grid = null;
    this.selectedCellsCallBacks = [];
	this.selectedCells = [];
    this.colorCounter = 0;
    this.container = containerID;

    /**
     * A setter for the dataset to display in the grid. The underlying SlickGrid object
     * will keep a reference to this data object after the fillUpGrid method is called, so
     * to reset the entire displayed data set, you must call fillUpGrid after using this
     * method, in order to
     * @param data
     */
    this.setData = function(data){
        this.data = data;

        var values = data2matrix(data);

        this.matrix = values[0];
        this.rowsSize = values[1];
        this.colsSize = values[2];
    };
	
	function editorCellFormatter(row, cell, value, columnDef, dataContext) {
		//var inputStr = "A3, #FF0000, #00FF00, #0000FF, #9966FF, #66FF99, #99CCFF, #FF99CC, #FF9933, #66CCFF, #FFFF99";
		//console.log("value"+value);
		var inputStr = value;
		if (inputStr != null) {
			var colorArray = inputStr.split(',');
			var colnum = Math.sqrt(colorArray.length - 1);
			colnum = Math.floor(colnum);
			var rownum = Math.ceil((colorArray.length - 1) / colnum);
			
			var cellStr = "<table style='width:100%;height:100%'>";
			cellStr += "<th rowspan='" + (rownum+1) + "'>" + colorArray[0] +"</th>"
			var i, j=0;
			var colorIdx = 1;
			for (i=0; i < colnum; i++) {
				cellStr += "<tr>";
				for (j=0; (j < rownum) && (colorIdx < colorArray.length); j++) {
					cellStr += "<td bgcolor='" + colorArray[colorIdx]+ "'> </td>" ;
					colorIdx++;
				}
				cellStr += "</tr>";
			}		
			cellStr += "</table>";
		} else {
			return "<span style='width:100%'>-</span>";
		}	
		return cellStr;
	}

    /**
     * This function creates a new SlickGrid in the constructor specified container with
     * the set data using the setData method.
     */
    this.fillUpGrid = function() {

        var columns = [];

        var options = {
            enableCellNavigation: true,
            enableColumnReorder: false,
            numberOfColumnsToFreeze: 1,
			rowHeight: 60
        };

        // create column labels, starting with column for the row labels
        columns.push({
            id: "0",
            name: "0",
            field: "0",
            width: 30,
            resizable: false,
            selectable: false,
            focusable: false
        });
        for (var k = 1; k <= this.colsSize; k++) {
            columns.push({
                id: k.toString(),
                name: k.toString(),
                field: k.toString(),
                width: 140,
				cssClass: "editor-cell",
				formatter: editorCellFormatter
            });
        }

        if (this.grid){
            document.getElementById(containerID).innerHTML="";
            this.grid.invalidate();
        }

        this.grid = new Slick.Grid("#"+containerID, this.matrix, columns, options);

        var selectionModel = new Slick.CellSelectionModel();
        this.grid.setSelectionModel(selectionModel);
        selectionModel.onSelectedRangesChanged.subscribe(updateSelectedCells);
    };

    /**
     * This method changes the displayed contents of a cell to something new
     * @param row - the row number of the cell to be changed (note that the column number
     *          labels row is considered row 0 but it cannot be changed)
     * @param column - - the column number of the cell to be changed (note that the row
     *          letter labels column is considered column is considered column 0, it
     *          can be changed, but I don't recommend it)
     * @param newContents - the new value the cell should display
     */
    this.updateCellContents = function(row, column, newContents){
        this.matrix[row-1][column.toString()] = newContents;
        this.grid.invalidateRow(row-1);
        this.grid.render();
    };

    /**
     * This method changes the displayed contents of multiple cells in the grid in one go.
     * It saves on re-rendering and should make multiple cell changes quicker than just
     * calling updateCellContents repeatedly
     * @param rowColNewContentArray an array of arrays, where the inner arrays have the
     *          form [row, column, newContents] where
     *              row - the row number of a cell to be changed (note that the column
     *                  number labels row is considered row 0 but it cannot be changed)
     *              column - - the column number of the cell to be changed (note that the
     *                  row letter labels column is considered column is considered column
     *                  0, it can be changed, but I don't recommend it)
     *              newContents - the new value the cell should display
     *
     *          These inner arrays represent one cell displayed value change
     */
    this.updateMultipleCellContents = function(rowColNewContentArray){
        for(var i=0; i<rowColNewContentArray.length; i++){
            var row = rowColNewContentArray[0];
            var column = rowColNewContentArray[1];
            var newContents = rowColNewContentArray[2];

            this.matrix[row-1][column.toString()] = newContents;
            this.grid.invalidateRow(row-1);
        }

        this.grid.render();
    };

    /**
     * This function sets the background color of a set of cells.
     * @param coordinates - an array of coordinates on the grid for which the background
     *                  color change should be made. These coordinates are arrays of
     *                  length 2 of the form [row, column]
     * @param color - the string hex representation of the desired background color for
     *              the cells
     * @param key - a string key, that can latter be used to undo the background color
     *              change using the removeCellColors method. Note that this method cannot
     *              be called more than once with the same key.
     */
    this.setCellColors = function (coordinates, color, key){
        var style = document.createElement('style');

        style.type = 'text/css';
        style.innerHTML = '.highlight'+this.colorCounter+' { background-color: ' + color +'; }';
        document.getElementsByTagName('head')[0].appendChild(style);

        var changes = {};
        for (var i=0; i<coordinates.length; i++){
            var row = coordinates[i][0];
            var column = coordinates[i][1];

            if(!changes[row]){
                changes[row] = {};
            }

            changes[row][column] = "highlight"+this.colorCounter;
        }

        this.grid.invalidateRow(row);
        this.grid.addCellCssStyles(key, changes);
        this.grid.render();

        this.colorCounter++;
		
		// hack
		console.log(coordinates);
		this.selectedCells.push(coordinates);
    };

    /**
     * This function un-does a cell set background color change done by the setCellColors
     * method. The change that is un-done is determined by the key that was used to do the
     * color change in the first place.
     * @param key - the key used to make the color change in the first place, that is to
     *              be un-done
     */
    this.removeCellColors = function(key){
        this.grid.removeCellCssStyles(key);
    };

    /**
     * This function registers a function to be called in an observer type pattern,
     * whenever a new set of cells is selected in the grid. The callback function is
     * expected to have four parameters in the following order: startRow, startCol,
     * endRow, endCol where:
     *      startRow - is the row number of the upper left cell bounding the selected
     *          cells
     *      startCol - is the column number of the upper left cell bounding the selected
     *          cells
     *      endRow - is the row number of the lower right cell bounding the selected cells
     *      endCol - is the column number of the lower right cell bounding the selected
     *          cells
     * @param callBack - a function to be
     */
    this.registerSelectedCellCallBack = function(callBack){
        this.selectedCellsCallBacks.push(callBack);
    };

    this.getDataPoint = function(row, column){
      return this.grid.getDataItem(row-1)[column.toString()];
    };

    /**
     * A private method for converting a 2D data array to the array containing
     * row objects format required by SlickGrid
     * @param data - a 2D array containing data to be converted to SlickGrid data format
     */
    function data2matrix(data) {
        var result = [];
        var rows = data.length;
        var cols = -1;

        for(var j = 0; j<rows; j++){

            var information = data[j];

            if (information.length > cols){
                cols = information.length;
            }

            result[j] = {};

            // add in row headers
            result[j]["0"] = Grid.getRowLabel(j+1);

            for(var k = 1; k <= information.length; k++){
                result[j][k.toString()] = information[k-1];
            }
        }



        return [result, rows, cols];
    }

    /**
     * A private method for calling all of the registered observer functions with the
     * startRow, startCol, endRow, endCol arguments for the event that the selected
     * cells on the grid have changed. This function itself is an event handler
     * for the onSelectedCellsChanged event in the SlickGrid library for
     * cellselectionmodel
     * @param event - the event
     * @param data - the object containing the selected cell range data
     */
    function updateSelectedCells(event, data){

        _self.selectedCellsCallBacks.forEach(function(element){
           if (data[0].toCell != 0 && data[0].fromCell != 0){
               element(data[0].fromRow,
                   data[0].fromCell,
                   data[0].toRow,
                   data[0].toCell
               )
           }
        });
    }
}

/**
 * A "Static" convenience method on the Grid class that converts a row number to a row
 * label letter. Note that 0->"", 1 -> "A", 2->"B", etc. This function is the inverse of
 * the getRowNumber method.
 * @param number - the row number to convert to a letter label
 * @returns {string} - the row label
 */
Grid.getRowLabel = function(number) {
    "use strict";

    if (number < 0 || number % 1 !== 0) {
        return "";
    }

    var label = "";
    var remainder;

    while (number > 0) {
        remainder = (number - 1) % 26;
        label = String.fromCharCode(STARTING_CHAR_CODE + remainder) + label;
        number = Math.floor((number - remainder) / ROW_HEAD_BASE);
    }

    return label;
};

/**
 * A "Static" convenience method on the Grid class that converts a row label letter to a
 * row number. Note that ""->0, "A"-> 1, "B"-> 2, etc. This function is the inverse of
 * the getRowLabel method.
 * @param label - the row label letter to convert to a row number.
 * @returns {number}
 */
Grid.getRowNumber = function(label) {
    "use strict";

    if (label === "") {
        return 0;
    }

    var number = 0;
    label = label.toUpperCase();

    for(var i=0; i < label.length; i++) {
        number *= ROW_HEAD_BASE;
        number += label.charCodeAt(i) - STARTING_CHAR_CODE + 1 ;
    }

    return number;
};