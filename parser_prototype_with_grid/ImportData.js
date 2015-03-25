/**
 * Created by zacharymartin on 3/24/15.
 */

function ImportData(){
    this.experimetIdentifier = -1;
    this.experimentLabels = {category -> label};
    this.plateLabels = {plateId -> {category -> label}};
    this.wellLabels = {plateId->{row->{column->{category->label}}}}
}