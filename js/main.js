function initExploreCardTap() {
    const cards = document.querySelectorAll('.sec_explore .explore_list li');

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            card.classList.add('is-tapped');
            setTimeout(() => {
                card.classList.remove('is-tapped');
            }, 300);
        });
    });
}

initExploreCardTap()
