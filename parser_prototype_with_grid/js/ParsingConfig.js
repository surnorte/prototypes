/**
 * Created by zacharymartin on 3/22/15.
 */

var WELL_LEVEL = "wellLevel";
var PLATE_LEVEL = "plateLevel";
var EXPERIMENT_LEVEL = "experimentLevel";

/**
 * The constructor for ParsingConfig objects.
 * @param name - a unique string name for the parsing configuration
 * @param machineName - a string name for the assay machine that the parsing configuration
 *                  is for.
 * @param description - a string description of the parsing configuration
 * @param exampleFileName - a string name for the example output file used to create the
 *                      configuration
 * @param exampleFileContents - the string contents of the example output file
 * @param delimiter - a string representing the delimiter to be used for parsing the
 *                  delimiter separated value file format. The acceptable values are:
 *                      "comma"
 *                      "semicolon"
 *                      "tab"
 * @param multiplePlatesPerFile - a boolean for whether or not the assay machine places
 *                          the results from multiple plates in a single file
 * @param multipleValuesPerWell - a boolean for whether or not multiple values per well
 *                          are given in the output files of the specified assay machine
 * @param gridFormat - a boolean for whether or not the file gives per well values in grid
 *                  format. If false this indicates that results are given in row per well
 *                  format.
 * @constructor
 */
function ParsingConfig(name,
                       machineName,
                       description,
                       exampleFileName,
                       exampleFileContents,
                       delimiter,
                       multiplePlatesPerFile,
                       multipleValuesPerWell,
                       gridFormat){
    this.name = name;
    this.machineName = machineName;
    this.description = description;
    this.exampleFileName = exampleFileName;
    this.exampleFileContents = exampleFileContents;
    this.delimiter = delimiter;
    this.plate = null;
    this.plateInvariates = [];  // elements stored as [relativeRow, relativeColumn, value]
    this.features = {};  // keyed on feature name
    this.multiplePlatesPerFile = multiplePlatesPerFile;
    this.multipleValuesPerWell = multipleValuesPerWell;
    this.gridFormat = gridFormat;

    this.isPlateStartRow = function(row, grid){
        for(var i=0; i<this.plateInvariates.length; i++){

            var invariateCol = this.plateInvariates[i][1];
            var invariateValue = this.plateInvariates[i][2].trim();

            var valueToCheck = grid.getDataPoint(row, invariateCol).trim();

            if (valueToCheck != invariateValue){
                return false;
            }
        }

        return true;
    };

    this.findPlates = function(startRow, endRow, grid){
        var plateRanges = []; // elements of form [startRow, startCol, endRow, endCol]
                              // each represents a plate on the grid

        for (var row = startRow; row<=endRow; row++){
            if (this.isPlateStartRow(row, grid)) {
                plateRanges.push([row,
                                  this.plate.topLeftCoords[1],
                                  row+this.plate.bottomRightCoords[0] - 1,
                                  this.plate.bottomRightCoords[1]])
            }
        }

        return plateRanges;
    };

    this.findExperimentLevelFeatureCoords = function(featureName){
        var feature = this.features[featureName];
        var row = feature.topLeftCoords[0];
        var col = feature.topLeftCoords[1];

        return [row, col];
    };

    this.findPlateLevelFeatureCoords = function(featureName, plates){
        var plateFeatures = [];
        var feature = this.features[featureName];

        for (var j=0; j<plates.length; j++){
            var plateTopLeftRow = plates[j][0];
            var plateTopLeftCol = plates[j][1];
            var row = plateTopLeftRow + feature.topLeftCoords[0] - 1;
            var col = plateTopLeftCol + feature.topLeftCoords[1] - 1;

            plateFeatures.push([row, col]);
        }

        return plateFeatures;
    };

    this.findWellLevelFeatureCoords = function(featureName ,plates){
        var wellFeatures = [];
        var feature = this.features[featureName];

        for (var j=0; j<plates.length; j++){
            var plateTopLeftRow = plates[j][0];
            var plateTopLeftCol = plates[j][1];
            var wellCounter = 0;
            var width
                = feature.bottomRightCoords[1] - feature.topLeftCoords[1] + 1;
            var height
                = feature.bottomRightCoords[0] - feature.topLeftCoords[0] + 1;
            var plateWellFeatures = [];

            for (var k = 0; k<height; k++ ){
                for (var m = 0; m<width; m++ ){
                    var row = plateTopLeftRow + feature.relativeToLeftY + k;
                    var col = plateTopLeftCol + feature.relativeToLeftX + m;

                    plateWellFeatures.push([row,
                        col]);

                    wellCounter++;
                }
            }

            wellFeatures.push(plateWellFeatures);
        }

        return wellFeatures;
    };

    this.getFeatureCoords = function(featureName, plates){
        var feature = this.features[featureName];
        var coords = [];
        var plate;
        var coordinates;

        if (feature.typeOfFeature == WELL_LEVEL){
            var wellFeatureCoords = this.findWellLevelFeatureCoords(featureName, plates);

            for (plate = 0; plate < wellFeatureCoords.length; plate++){
                var plateCoords = wellFeatureCoords[plate];

                for (var i=0; i<plateCoords.length; i++){
                    coordinates = plateCoords[i];

                    coords.push(coordinates);
                }
            }
        } else if (feature.typeOfFeature == PLATE_LEVEL) {
            var plateFeatureCoords = this.findPlateLevelFeatureCoords(featureName,plates);

            for (plate = 0; plate < plateFeatureCoords.length; plate++){
                coordinates = plateFeatureCoords[plate];

                coords.push(coordinates);
            }
        } else if (feature.typeOfFeature == EXPERIMENT_LEVEL){
            coords.push(this.findExperimentLevelFeatureCoords(featureName));
        }

        return coords;
    };

    this.highlightPlatesAndFeatures = function(plates, colorPicker, grid){
        var coordsToHighlight = [];
        var colorKeys = [];
        var colorKey;

        // first highlight plates
        for (var plateIndex=0; plateIndex<plates.length; plateIndex++){
            var plateRange = plates[plateIndex];
            var startRow = plateRange[0];
            var startCol = plateRange[1];
            var endRow = plateRange[2];
            var endCol = plateRange[3];
            colorKey = colorPicker.getDistinctColorKey();
            colorKeys.push(colorKey);

            coordsToHighlight = ParsingConfig.getCoordsInARange(startRow,
                                                                startCol,
                                                                endRow,
                                                                endCol);

            grid.setCellColors(coordsToHighlight,
                              colorPicker.getColorByIndex(this.plate.color),
                              colorKey);
        }

        // next highlight features

        for(var featureName in this.features){
            var feature = this.features[featureName];
            colorKey = colorPicker.getDistinctColorKey();
            colorKeys.push(colorKey);

            coordsToHighlight = this.getFeatureCoords(featureName, plates);

            grid.setCellColors(coordsToHighlight,
                               colorPicker.getColorByIndex(feature.color),
                               colorKey);
        }

        return colorKey
    };


    this.createImportData = function(plates, plateIDs, grid){
        var importData = new ImportData("test identifier");

        for (var featureName in this.features){
            var feature = this.features[featureName];
            var category = feature.featureLabel;

            if (feature.typeOfFeature == WELL_LEVEL){
                var wellFeatureCoords = this.findWellLevelFeatureCoords(featureName, plates);

                for (plate = 0; plate < wellFeatureCoords.length; plate++){
                    var plateCoords = wellFeatureCoords[plate];
                    var plateID = plateIDs[plate];

                    if (!importData.wellFeatures[plateID]){
                        importData.wellFeatures[plateID] = {};
                    }

                    for (var i=0; i<plateCoords.length; i++){
                        var gridCoordinates = plateCoords[i];
                        var gridRow = gridCoordinates[0];
                        var gridColumn = gridCoordinates[1];
                        var plateCoordinates = ParsingConfig.wellNumberToPlateCoords(i, plateCoords.length, 2, 3);
                        var plateRow = plateCoordinates[0];
                        var plateColumn = plateCoordinates[1];
                        var value = grid.getDataPoint(gridRow, gridColumn);

                        if (!importData.wellFeatures[plateID][plateRow]){
                            importData.wellFeatures[plateID][plateRow] = {};
                        }

                        if (!importData.wellFeatures[plateID][plateRow][plateColumn]){
                            importData.wellFeatures[plateID][plateRow][plateColumn] = {};
                        }

                        importData.wellFeatures[plateID][plateRow][plateColumn][category]
                            = value;
                    }
                }
            } else if (feature.typeOfFeature == PLATE_LEVEL) {
                var plateFeatureCoords = this.findPlateLevelFeatureCoords(featureName,plates);

                for (plate = 0; plate < plateFeatureCoords.length; plate++){
                    var plateID = plateIDs[plate];

                    if (!importData.plateFeatures[plateID]){
                        importData.plateFeatures[plateID] = {};
                    }

                    var gridCoordinates = plateFeatureCoords[plate];
                    var gridRow = gridCoordinates[0];
                    var gridColumn = gridCoordinates[1];
                    var value = grid.getDataPoint(gridRow, gridColumn);


                    importData.plateFeatures[plateID][category] = value;
                }
            } else if (feature.typeOfFeature == EXPERIMENT_LEVEL){
                var gridCoordinates = this.findExperimentLevelFeatureCoords(featureName);
                var gridRow = gridCoordinates[0];
                var gridColumn = gridCoordinates[1];
                var value = grid.getDataPoint(gridRow, gridColumn);

                importData.experimentFeatures[category] = value;
            }


        }

        return importData;
    }
}

ParsingConfig.wellNumberToPlateCoords = function(index, numberOfWells, rowProportion, colProportion){
    var base = Math.sqrt(numberOfWells/(rowProportion * colProportion));
    var numColumns = base * colProportion;
    var numRows = base * rowProportion;

    var row = Math.floor(index/numColumns);
    var col = index % numColumns;

    return [row, col];
};

ParsingConfig.getCoordsInARange = function(startRow, startCol, endRow, endCol){
    var coordinates = [];
    for (var row = startRow; row<=endRow; row++){
        for (var col = startCol; col<=endCol; col++){
            coordinates.push([row, col]);
        }
    }
    return coordinates;
};
