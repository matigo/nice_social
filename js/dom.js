function toggleClassIfExists(id, oldClass, newClass, toggle) {
	
	var d = document.getElementById(id);
	
	if (hasClass(d,oldClass)) {
		d.className = d.className.replace(oldClass, "");
		d.className = d.className.replace(newClass, ""); // first remove the class name if that already exists
		d.className = d.className + newClass; // adding new class name
	} else if (toggle) {
		d.className = d.className.replace(newClass, "");
		d.className = d.className.replace(oldClass, ""); // first remove the class name if that already exists
		d.className = d.className + oldClass; // adding new class name		
	}
}

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}