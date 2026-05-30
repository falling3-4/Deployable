// let selectedCategory = "";
// let currentPage = 1;
// let totalPages = 1;

// export function getGamesState() {
//   return { selectedCategory, currentPage, totalPages };
// }

// export function setGamesState(state: Partial<{ selectedCategory: string, currentPage: number, totalPages: number }>) {
//   if (state.selectedCategory !== undefined) selectedCategory = state.selectedCategory;
//   if (state.currentPage !== undefined) currentPage = state.currentPage;
//   if (state.totalPages !== undefined) totalPages = state.totalPages;
// }

// export async function renderCategories(categories: string[]) {
//   const gamesCategories = document.getElementById("games-categories") as HTMLDivElement;
//   const gamesSearch = document.getElementById("games-search") as HTMLInputElement;

//   gamesCategories.innerHTML = `
//     <button class="category-btn ${selectedCategory === "" ? "active" : ""}" data-category="">All</button>
//     ${categories.map((cat) => `<button class="category-btn ${selectedCategory === cat ? "active" : ""}" data-category="${cat}">${cat}</button>`).join("")}
//   `;
//   gamesCategories.querySelectorAll(".category-btn").forEach((btn) => {
//     (btn as HTMLElement).onclick = () => {
//       selectedCategory = (btn as HTMLButtonElement).dataset.category || "";
//       currentPage = 1;
//       loadGames(gamesSearch.value, selectedCategory, currentPage);
//     };
//   });
// }

// export async function loadGames(query = "", category = "", page = 1) {
//   const gamesLoader = document.getElementById("games-loader") as HTMLDivElement;
//   const gamesGrid = document.getElementById("games-grid") as HTMLDivElement;
//   const pageInfo = document.getElementById("page-info") as HTMLSpanElement;
//   const prevPageBtn = document.getElementById("prev-page") as HTMLButtonElement;
//   const nextPageBtn = document.getElementById("next-page") as HTMLButtonElement;

//   gamesLoader.style.display = "block";
//   gamesGrid.innerHTML = "";

//   try {
//     const opts: any = {
//       page: page,
//       limit: 30,
//     };

//     if (query.trim()) opts.q = query.trim();
//     if (category) opts.category = category;

//     const { games, pages } = await (window as any).Lumin.getGames(opts);

//     totalPages = pages || 1;
//     currentPage = page;
//     pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
//     prevPageBtn.disabled = currentPage <= 1;
//     nextPageBtn.disabled = currentPage >= totalPages;

//     const { categories } = await (window as any).Lumin.getCategories();
//     renderCategories(categories);

//     const images = await Promise.all(
//       games.map((g: any) => (window as any).Lumin.getImageUrl(g.image_token)),
//     );

//     gamesGrid.innerHTML = games
//       .map(
//         (game: any, i: number) => `
//       <div class="game-card" data-id="${game.id}">
//         <div class="game-img-container">
//           <img src="${images[i]}" alt="${game.name}" loading="lazy" />
//         </div>
//         <div class="game-info">
//           <span class="game-name">${game.name}</span>
//           <span class="game-category">${game.category || ""}</span>
//         </div>
//       </div>
//     `,
//       )
//       .join("");

//     gamesGrid.querySelectorAll(".game-card").forEach((card) => {
//       (card as HTMLElement).onclick = () => {
//         const id = (card as HTMLElement).dataset.id;
//         if (id) (window as any).Lumin.loadGame(id);
//       };
//     });
//   } catch (err) {
//     gamesGrid.innerHTML = `<div class="error">No games found or failed to load.</div>`;
//     totalPages = 1;
//     currentPage = 1;
//     pageInfo.textContent = `Page 1 of 1`;
//     prevPageBtn.disabled = true;
//     nextPageBtn.disabled = true;
//   } finally {
//     gamesLoader.style.display = "none";
//   }
// }
