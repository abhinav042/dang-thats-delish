import axios from "axios";
import dompurify from "dompurify";

function searchResultsHTML(stores) {
	return stores.map(store => {
		return `
			<a href="/store/${store.slug}" class="search__result">
				<strong>${store.name}</strong>
			</a>
		`;
	}).join("");
}

function typeAhead(search) {

	// if no search bar (somehow), exit function
	if(!search)
		return;

	// selecting search results and search input
	const searchInput = search.querySelector("input[name='search']");
	const searchResults = search.querySelector(".search__results");

	// on input, process the input value
	searchInput.on("input", function() {
		if(!this.value) {
			searchResults.style.display = "none";
			return; // exit the function
		}

		// show the results
		searchResults.style.display = "block";
		searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results found for ${this.value}</div>`);

		axios
			.get(`/api/search/?q=${this.value}`)
			.then(res => {
				if(res.data.length) {
					searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
				}
			})
			.catch(err => {
				console.error(err);
			})
	});

	// handle keyboard inputs
	searchInput.on("keyup", (e) => {
		// if keycode ain't 13 (enter), 40(down), 38(up) - skip the func
		if(![13, 40, 38].includes(e.keyCode)) {
			return;
		}
		const activeClass = "search__result--active";
		const current = search.querySelector(`.${activeClass}`);
		const items = search.querySelectorAll(".search__result");
		let next;
		if (e.keyCode===40 && current) {
			next = current.nextElementSibling || items[0];
		} else if (e.keyCode===40) {
			next = items[0];
		} else if (e.keyCode===38 && current) {
			next = current.previousElementSibling || items[items.length - 1];
		} else if (e.keyCode===38) {
			next = items[items.length - 1];
		} else if (e.keyCode===13 && current.href) {
			window.location = current.href;
			return;
		}
		if (current) current.classList.remove(activeClass);
		next.classList.add(activeClass);
	})
};

export default typeAhead;