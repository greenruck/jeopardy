// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

// ~~~ API GLOBALS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ API GLOBALS ~~~~~~~~~~~~~~~~~~~~~~~~~~~

let categories = [];  // holds all the categories and questions
const BASE_URL = `https://jservice.io/api`;
const questionCount = 5;
const categoryCount = 6;

// ~~~ CATEGORIES AND CLUES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CATEGORIES AND CLUES ~~~~~~~~~~~~~~~~~~~

class Category {
  /** Get NUM_CATEGORIES random category from API.
  * Returns array of category ids
  */
  static async getCategoryIds() {
    let response = await axios.get(`${BASE_URL}/categories`, {
      params: {
        count: "100",
        offset: Math.floor(Math.random() * (444) + 4) // RNG to vary offset between each request
      }
    });

    // Lodash selects 6 random categories
    let randomCategories = _.sampleSize(response.data, categoryCount)

    // make new array with only the category IDs
    let categoryIds = randomCategories.map((catObj) => {
      return catObj.id;
    });

    return categoryIds;
  }

  // Fill 'categories' array with 6 objects, each with 5 questions
  static async getAllCategoriesAndQuestions() {
    categories = [];
    let categoryIds = await Category.getCategoryIds();
    for ( let categoryId of categoryIds ) {
      let totalCategory = await Category.getCategory(categoryId);
      categories.push(totalCategory);
    }
    return categories;
  }


  /** Return object with data about a category:
   *
   *  Returns {
   *    title: "Math",
   *    clues: clue-array
   *  }
   *
   * Where clue-array is:
   *   [
   *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
   *      {question: "Bell Jar Author", answer: "Plath", showing: null},
   *      ...
   *   ]
   */
  static async getCategory(catId) {
    let response = await axios.get(`${BASE_URL}/clues`, {
      params: {
        category: catId
      }
    });
    // Lodash selects 5 random questions
    let fiveQuestions = _.sampleSize(response.data, questionCount);

    // format each question object inside array
    let questionArray = fiveQuestions.map((question) => {
      //
      if (question.answer.startsWith('<i>')) {
        question.answer = question.answer.slice(3, -3);
      }
      return {
        question: question.question,
        answer: question.answer,
        showing: null
      }
    });

    let categoryQuestions = {
      title: response.data[0].category.title, // get category title from 'response'
      clues: questionArray
    }
    return categoryQuestions;
  }
}
$(async function () {
    const $button = $("button");
    const $tDiv = $("#table-container");
  
    // for formatting category titles
    function toTitleCase(str) {
      let lowerStr = str.toLowerCase();
      return lowerStr.replace(/(?:^|\s)\w/g, (match) => {
          return match.toUpperCase();
      });
    }
  
    /** Fill the HTML table with the categories & cells for questions.
     * - The <thead> should be filled w/a <tr>, and a <td> for each category
     * - The <tbody> should be filled w/NUM-QUESTIONS_PER_CAT <tr>s,
     *   each with a question for each category in a <td>
     *   (initally, just show a "?" where the question/answer would go.)
     */
    async function fillTable() {
      let $tHead = $("<thead>");
      let $tBody = $("<tbody>");
      let $table = $("<table>")
        .prepend($tHead)
        .append($tBody);
  
      // generate each table cell with '?', add coordinate ID, append to row, row appends to tbody
      for (let j = 0; j < questionCount; j++) {
        let $tRow = $("<tr>");
        for (let i = 0; i < categoryCount; i++) {
          let $qMark = $("<i>")
            .attr("class", "fas fa-question-circle");
          let $tCell = $("<td>")
            .attr("id", `${i}-${j}`)
            .append($qMark);
          $tRow.append($tCell);
        }
        $tBody.append($tRow);
      }
  
      // generate header cells, apply category title on the way, append to thead
      for (let k = 0; k < categoryCount; k++) {
        let $tCell = $("<th>")
          .attr("id", `cat-${k}`)
          .text(toTitleCase(categories[k].title));
        $tHead.append($tCell);
      }
  
      // append whole table to container div
      $tDiv.append($table);
  
    }
  
    /** Handle clicking on a clue: show the question or answer.
     * 
     * Uses .showing property on clue to determine what to show:
     * - if currently null, show question & set .showing to "question"
     * - if currently "question", show answer & set .showing to "answer"
     * - if currently "answer", ignore click
     * 
     * Each table cell has a unique x-y coordinate ID, which maps to the category
     * and question within that category.
     * 
     * x = category (0-5, going across table, also is index of global array categories)
     * y = question (0-4, going down table, also is index of question array inside chosen category)
     * 
     * example: clicking on a cell with the ID '2-4' will access categories[2].clues[4]
     * 
     * */
    function showQorA(id) {
      let $clickedCell = $(`#${id}`);
      let category = id.slice(0, 1);
      let question = id.slice(2);
  
      // shorthand variables for game data
      let unit = categories[category].clues[question];
      let asking = unit.question;
      let answer = unit.answer;
  
      // check clicked question for what .showing is
      if (unit.showing === null) { // show the question
        $clickedCell.text(asking);
        unit.showing = "question";
      }
      else if (unit.showing === "question") { // show the answer
        $clickedCell.toggleClass("answer")
        $clickedCell.text(answer);
        unit.showing = "answer";
        
      }
    }
  
    /** Wipe the current Jeopardy board,
     * and update the button used to fetch data.
     */
   
  
    function newGame() {
      $button.text("Restart!");
      $tDiv.empty(); 
    }
  
    /** Start game: button press
     *
     * - get random category Ids
     * - get data for each category
     * - create HTML table
     * */
    async function setupAndStart() {
      await Category.getAllCategoriesAndQuestions(); // call API and format data
      newGame(); // hide load screen
      fillTable(); // table creation and labeling
      addListeners(); // apply event listener to table
    }
  
    /** On click of start / restart button, set up game. */
    $button.on("click", async () => {
      setupAndStart();
    });
  
    /** On page load, add event handler for clicking clues */
    async function addListeners() {
      const $gameTable = $("table");
      $gameTable.on("click", "td", (evt) => {
        showQorA(evt.target.id);
      });
    }
  });