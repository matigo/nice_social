function toggleClassIfExists(id, oldClass, newClass, toggle) {
    var d = document.getElementById(id);
    if ( d === null || d === undefined ) { return false; }
    if (hasClass(d,oldClass)) {
        toggleClassWithElement(d,oldClass,newClass);
    } else if (toggle) {
        toggleClassWithElement(d,newClass,oldClass);
    }
}
function addClassIfNotExists(id, newClass) {
    var d = document.getElementById(id);
    if ( d === null || d === undefined ) { return false; }
    if ( hasClass(d, newClass) === false ) { addClass(id, newClass); }
}
function removeClassIfExists(id, oldClass) {
    var d = document.getElementById(id);
    if ( d === null || d === undefined ) { return false; }
    if ( hasClass(d, oldClass) ) { removeClass(id, oldClass); }
}
function checkHasClass(id, cls) {
    var d = document.getElementById(id);
    if ( d === null || d === undefined ) { return false; }
    return hasClass(d, cls);
}
function removeClass(id, cls) {
    var d = document.getElementById(id);
    var strClass = d.className.replace(cls, "");
    d.className = strClass.replace(/^\s+|\s+$/gm,'');
}
function addClass(id, cls) {
    var d = document.getElementById(id);
    d.className = d.className.replace(cls, ""); // first remove the class name if that already exists
    d.className = d.className + ' ' + cls; // adding new class name
}
function toggleClass(id, oldClass, newClass) {
    var d = document.getElementById(id);
    toggleClassWithElement(d,oldClass,newClass);
}
function toggleClassWithElement(element, oldClass, newClass) {
    element.className = element.className.replace(oldClass, "");
    if ( newClass !== '' ) { element.className = element.className.replace(newClass, ""); }
    var strClass = element.className.replace(/^\s+|\s+$/gm,'');
    element.className = strClass + ((newClass !== '') ? ' ' + newClass : ''); // Add New Class Name if Applicable
}
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}