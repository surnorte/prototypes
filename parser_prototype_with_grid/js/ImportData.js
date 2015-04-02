/**
 * Created by zacharymartin on 3/24/15.
 */

function ImportData(experimentIdentifier){
    this.experimentIdentifier = experimentIdentifier;
    this.experimentFeatures = {};
    this.plateFeatures = {};
    this.wellFeatures = {};

    //this.experimentIdentifier = -1;
    //this.experimentLabels = {category -> label};
    //this.plateLabels = {plateId -> {category -> label}};
    //this.wellLabels = {plateId->{row->{column->{category->label}}}}
}