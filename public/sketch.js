let categoriesLoaded = false;
let autoSelected = 0;
let documentsUsed = 0;
let categoriesUsed = 0;

let minCategory;
let categories = [];
let numCategories;

const config = {
	categoriesUsed: 10,
	documentsUsed: 10,
};

// UI
let labelCategoriesUsed;
let inputAutoSelected;
let inputDocumentsUsed;

function setup() {
	noCanvas();

	initUI();

	const btnLoad = document.getElementById('load');
	btnLoad.addEventListener('click', async (event) => {
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

		const counts = jsonData.counts;
		const categories = jsonData.categories;
		const examples = jsonData.examples;

		let minCount = Number.MAX_VALUE;
		{ // Find category with min number of documents
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
				if (categoriesUsed < autoSelected) {
					enabled = true;
					categoriesUsed += 1;
				}
				
				let toggle = createCheckbox(category.toLowerCase(), enabled);
				toggle.changed(() => {
					let setActive = toggle.checked();

					if (setActive) {
						categoriesUsed += 1;
						labelCategoriesUsed.textContent = categoriesUsed;
					}
					else if (!setActive){
						categoriesUsed -= 1;
						labelCategoriesUsed.textContent = categoriesUsed;
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

		categoriesLoaded = true;
	});
}

let isInit = true;
function initUI() {
	labelCategoriesUsed = document.getElementById('labelCategoriesUsed');
	inputAutoSelected = document.getElementById('autoSelected');
	inputDocumentsUsed = document.getElementById('documentsUsed');

	categoriesUsed = 0;
	documentsUsed = config.documentsUsed;

	if (isInit) {
		autoSelected = config.categoriesUsed;
	}
	inputAutoSelected.value = autoSelected;
	inputAutoSelected.addEventListener('change', (event)=> {
		if (isInit) {
			inputAutoSelected.value = config.categoriesUsed;
			return;
		}

		if (event.target.value >= numCategories) {
			inputAutoSelected.value = numCategories;
		}
		autoSelected = inputAutoSelected.value;
	});

	labelCategoriesUsed.textContent = autoSelected;

	inputDocumentsUsed.value = documentsUsed;
	inputDocumentsUsed.addEventListener('change', (event)=> {
		if (isInit) {
			inputDocumentsUsed.value = config.documentsUsed;
			return;
		}

		if (event.target.value >= minCategory) {
			inputAutoSelected.value = minCategory;
		}

		documentsUsed = event.target.value;
	});
}