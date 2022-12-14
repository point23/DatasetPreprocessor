let categoriesLoaded = false;
let autoSelected = 0;
let numDocumentsUsed = 0;
let numCategoriesUsed = 0;
let categoriesUsed = {};

let minCategory;
let categories = [];
let counts;
let examples;
let numCategories;

let isInit = true;

const config = {
	numCategoriesUsed: 10,
	numDocumentsUsed: 10,
};

// UI
let labelCategoriesUsed;
let inputAutoSelected;
let inputDocumentsUsed;
let btnLoad;
let btnSubmit;

function setup() {
	noCanvas();

	getUIElemnents();
	initUI();

	btnLoad.addEventListener('click', loadCategoriesAsync);
	btnSubmit.addEventListener('click', submitCategoriesUsedAsync);
}

function getUIElemnents() {
	labelCategoriesUsed = document.getElementById('labelCategoriesUsed');
	inputAutoSelected = document.getElementById('autoSelected');
	inputDocumentsUsed = document.getElementById('documentsUsed');
	btnLoad = document.getElementById('load');
	btnSubmit = document.getElementById('submit');
}

function initUI() {
	numCategoriesUsed = 0;
	numDocumentsUsed = config.numDocumentsUsed;
	if (isInit) {
		autoSelected = config.numCategoriesUsed;
	}

	inputAutoSelected.value = autoSelected;
	inputAutoSelected.addEventListener('change', (event)=> {
		if (isInit) {
			inputAutoSelected.value = config.numCategoriesUsed;
			return;
		}

		if (event.target.value >= numCategories) {
			inputAutoSelected.value = numCategories;
		}
		autoSelected = inputAutoSelected.value;
	});

	labelCategoriesUsed.textContent = autoSelected;

	inputDocumentsUsed.value = numDocumentsUsed;
	inputDocumentsUsed.addEventListener('change', (event)=> {
		if (isInit) {
			inputDocumentsUsed.value = config.numDocumentsUsed;
			return;
		}

		if (event.target.value >= minCategory) {
			inputAutoSelected.value = minCategory;
		}

		numDocumentsUsed = event.target.value;
	});
}

async function loadCategoriesAsync(event) {
	isInit = false;

	if (categoriesLoaded) {
		removeElements();
		initUI();
		categoriesLoaded = false;
	}

	let response = await fetch('/load');
	let jsonData = await response.json();

	console.log(jsonData);

	numCategories = jsonData.numCategories;
	categories = jsonData.categories;
	counts = jsonData.counts;	
	examples = jsonData.examples;

	let minCount = Number.MAX_VALUE;
	{ // Sorted and Get Categoy with min number of documents
		categories.sort();

		for (let category of categories) {
			if (minCount > counts[category]) {
				minCount = counts[category];
			}
		}
		minCategory = minCount;
	}

	{ // Create toggles for each category
		createDiv('Categories: ');
		for (let category of categories) {
			let enabled = false;
			if (numCategoriesUsed < autoSelected) {
				enabled = true;
				numCategoriesUsed += 1;
				categoriesUsed[category] = true;
			}
			else {
				categoriesUsed[category] = false;
			}
			
			let toggle = createCheckbox(category.toLowerCase(), enabled);
			toggle.changed(() => {
				let setActive = toggle.checked();

				if (setActive) {
					numCategoriesUsed += 1;
					labelCategoriesUsed.textContent = numCategoriesUsed;
					categoriesUsed[category] = true;
				}
				else if (!setActive){
					numCategoriesUsed -= 1;
					labelCategoriesUsed.textContent = numCategoriesUsed;
					categoriesUsed[category] = false;
				}
			});
		}
	}

	createP();

	{ // Examples Links:
		createDiv('Example Links: ');
		for (let category of categories) {
			createA(examples[category], category.toLowerCase());
			createDiv();
		}
	}

	renderChart();

	categoriesLoaded = true;
}

async function submitCategoriesUsedAsync() {
	let categoriesUsedArray = [];
	for (let category of categories) {
		if (categoriesUsed[category]) {
			categoriesUsedArray.push(category);
		}
	}

	let data = {
		numDocumentsUsed: numDocumentsUsed,
		numCategoriesUsed: numCategoriesUsed,
		categoriesUsed: categoriesUsedArray,
	}

	let options = {						
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	};

	let response = await fetch('/submit', options);
	let jsonData = await response.json();
	console.log(jsonData);
}

function renderChart() {
	let labels = categories;
	let data = [];
	for (let category of categories) {
		data.push(counts[category]);
	}

	const ctx = document.getElementById('chart');
	new Chart(ctx, {
			type: 'line',
			data: {
			labels: labels,
			datasets: [{
				label: 'News Categories Distribution',
				data: data,
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				borderColor: 'rgba(255, 99, 132, 1)',
				borderWidth: 1,
				fill: true,
			}]
		},
		options: {
			scales: {
				y: {
					beginAtZero: false,
				}
			}
		}
	});
}