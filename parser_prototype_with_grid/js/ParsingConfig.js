/**
 * Created by zacharymartin on 3/22/15.
 */


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
    this.experimentFeatures = [];
    this.features = [];
    this.multiplePlatesPerFile = multiplePlatesPerFile;
    this.multipleValuesPerWell = multipleValuesPerWell;
    this.gridFormat = gridFormat;
}