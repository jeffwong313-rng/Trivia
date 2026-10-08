// Question supply, by topic:
//   • Open Trivia DB (free, thousands of questions) for the "otdb" topics,
//     filtered to drop overly specific ones (exact years, release dates…)
//   • a hand-written bank (backup for every topic, and the only source for some)
//   • generated brain teasers (puzzles.js)
import { TOPICS, ALL_TOPIC_IDS } from './config.js';
import { generate } from './puzzles.js';

const API = 'https://opentdb.com/api.php';
const TOKEN_API = 'https://opentdb.com/api_token.php';
const OTDB_TIER = { easy: 1, medium: 2, hard: 3 };

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Hand-written bank: topic → [tier, prompt, correct, [wrong×3]] ──────
// Dates only appear when they're true landmark moments.
const BANK = {
  general: [
    [1, 'How many days are in a leap year?', '366', ['365', '364', '367']],
    [1, 'What color traffic light means "go"?', 'Green', ['Red', 'Yellow', 'Blue']],
    [1, 'How many sides does a hexagon have?', '6', ['5', '7', '8']],
    [1, 'How many hours are in a day?', '24', ['12', '20', '36']],
    [1, 'Which month comes after June?', 'July', ['May', 'August', 'April']],
    [1, 'What does a thermometer measure?', 'Temperature', ['Weight', 'Speed', 'Time']],
    [1, 'What shape has three sides?', 'Triangle', ['Square', 'Circle', 'Pentagon']],
    [2, 'How many zeros are in one million?', '6', ['5', '7', '9']],
    [2, 'What is the hardest natural substance?', 'Diamond', ['Gold', 'Granite', 'Quartz']],
    [2, 'How many minutes are in two hours?', '120', ['100', '90', '150']],
    [2, 'What do you call a word that reads the same backwards, like "level"?', 'A palindrome', ['An acronym', 'A homophone', 'A synonym']],
    [3, 'Which language has the most native speakers?', 'Mandarin Chinese', ['English', 'Spanish', 'Hindi']],
    [3, 'What is a group of crows called?', 'A murder', ['A pack', 'A pride', 'A school']],
    [3, 'Which letter does not appear in any U.S. state name?', 'Q', ['Z', 'X', 'J']],
    [3, 'Which food is famous for almost never spoiling if sealed?', 'Honey', ['Bread', 'Cheese', 'Rice cakes']],
    [4, 'What is the largest desert in the world, counting cold deserts?', 'Antarctica', ['Sahara', 'Gobi', 'Arabian']],
    [4, 'How many squares are on a Rubik\'s Cube face (standard 3×3)?', '9', ['6', '12', '16']],
  ],
  geography: [
    [1, 'What is the capital of France?', 'Paris', ['Lyon', 'Marseille', 'Nice']],
    [1, 'Which continent is Egypt in?', 'Africa', ['Asia', 'Europe', 'South America']],
    [1, 'What is the largest ocean on Earth?', 'Pacific Ocean', ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean']],
    [1, 'Which country is shaped like a boot?', 'Italy', ['Spain', 'Greece', 'Portugal']],
    [1, 'How many continents are there?', '7', ['5', '6', '8']],
    [2, 'What is the capital of Japan?', 'Tokyo', ['Kyoto', 'Osaka', 'Seoul']],
    [2, 'Which is the largest country by area?', 'Russia', ['Canada', 'China', 'United States']],
    [2, 'Which U.S. state is made up entirely of islands?', 'Hawaii', ['Alaska', 'Florida', 'Maine']],
    [2, 'What is the capital of Canada?', 'Ottawa', ['Toronto', 'Vancouver', 'Montreal']],
    [2, 'What is the smallest country in the world?', 'Vatican City', ['Monaco', 'San Marino', 'Malta']],
    [2, 'Which river flows through Cairo?', 'The Nile', ['The Congo', 'The Niger', 'The Tigris']],
    [2, 'What is the capital of Australia?', 'Canberra', ['Sydney', 'Melbourne', 'Perth']],
    [3, 'What is the capital of Brazil?', 'Brasília', ['Rio de Janeiro', 'São Paulo', 'Salvador']],
    [3, 'Mount Everest sits on the border of Nepal and which country?', 'China', ['India', 'Bhutan', 'Pakistan']],
    [3, 'Which country has the most natural lakes?', 'Canada', ['Russia', 'Finland', 'United States']],
    [3, 'Which country has the largest population?', 'India', ['China', 'United States', 'Indonesia']],
    [4, 'What is the capital of Mongolia?', 'Ulaanbaatar', ['Astana', 'Bishkek', 'Tashkent']],
    [4, 'What is the deepest lake in the world?', 'Lake Baikal', ['Lake Superior', 'Lake Tanganyika', 'Caspian Sea']],
    [4, 'The city of Timbuktu is in which country?', 'Mali', ['Niger', 'Morocco', 'Chad']],
    [4, 'Which African country has the most pyramids?', 'Sudan', ['Egypt', 'Libya', 'Ethiopia']],
  ],
  history: [
    [1, 'Who was the first President of the United States?', 'George Washington', ['Abraham Lincoln', 'Thomas Jefferson', 'John Adams']],
    [1, 'Which ancient people built the pyramids of Giza?', 'The Egyptians', ['The Romans', 'The Greeks', 'The Vikings']],
    [1, 'Which ship sank after hitting an iceberg in 1912?', 'Titanic', ['Lusitania', 'Mayflower', 'Britannic']],
    [1, 'In what year did the September 11 attacks happen?', '2001', ['1999', '2000', '2003']],
    [1, 'Julius Caesar was a leader of which ancient city?', 'Rome', ['Athens', 'Sparta', 'Cairo']],
    [1, 'Which great wall was built to protect China from invaders?', 'The Great Wall', ['Hadrian\'s Wall', 'The Berlin Wall', 'The Western Wall']],
    [2, 'In what year did humans first walk on the Moon?', '1969', ['1965', '1972', '1959']],
    [2, 'In what year did the United States declare independence?', '1776', ['1789', '1812', '1492']],
    [2, 'In what year did Christopher Columbus first reach the Americas?', '1492', ['1592', '1392', '1620']],
    [2, 'In what year did World War II end?', '1945', ['1939', '1918', '1950']],
    [2, 'Which queen of ancient Egypt allied with Mark Antony?', 'Cleopatra', ['Nefertiti', 'Hatshepsut', 'Isis']],
    [2, 'Which civilization built Machu Picchu?', 'The Inca', ['The Aztec', 'The Maya', 'The Olmec']],
    [2, 'Who gave the "I Have a Dream" speech?', 'Martin Luther King Jr.', ['Malcolm X', 'Rosa Parks', 'Frederick Douglass']],
    [2, 'Which war was fought between the northern and southern U.S. states?', 'The Civil War', ['The Revolutionary War', 'The War of 1812', 'The Mexican-American War']],
    [3, 'In what year did the Berlin Wall fall?', '1989', ['1991', '1985', '1961']],
    [3, 'In what year did the French Revolution begin?', '1789', ['1776', '1815', '1848']],
    [3, 'In what year did World War I begin?', '1914', ['1918', '1905', '1939']],
    [3, 'Who was the first person to fly solo nonstop across the Atlantic?', 'Charles Lindbergh', ['Amelia Earhart', 'The Wright brothers', 'Howard Hughes']],
    [3, 'Which document did King John of England agree to in 1215?', 'Magna Carta', ['Domesday Book', 'Bill of Rights', 'Treaty of Paris']],
    [4, 'In what year did the Soviet Union break up?', '1991', ['1989', '1985', '1993']],
    [4, 'Who was the first emperor of a unified China?', 'Qin Shi Huang', ['Kublai Khan', 'Sun Yat-sen', 'Confucius']],
    [4, 'In what year did Nelson Mandela become President of South Africa?', '1994', ['1990', '1988', '1999']],
  ],
  science: [
    [1, 'What gas do humans need to breathe to live?', 'Oxygen', ['Carbon dioxide', 'Helium', 'Nitrogen']],
    [1, 'What is H₂O more commonly called?', 'Water', ['Salt', 'Hydrogen', 'Air']],
    [1, 'What force pulls things down toward the Earth?', 'Gravity', ['Magnetism', 'Friction', 'Wind']],
    [1, 'Which part of a plant takes in water from the soil?', 'The roots', ['The leaves', 'The petals', 'The stem']],
    [1, 'What do plants need from the Sun to make food?', 'Light', ['Rain', 'Wind', 'Sound']],
    [2, 'At sea level, water boils at what temperature in Celsius?', '100°C', ['90°C', '110°C', '212°C']],
    [2, 'What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go']],
    [2, 'What is the center of an atom called?', 'The nucleus', ['The electron', 'The orbit', 'The molecule']],
    [2, 'Which part of the cell is known as its powerhouse?', 'Mitochondria', ['Nucleus', 'Ribosome', 'Cell wall']],
    [2, 'What kind of rock is formed from cooled lava?', 'Igneous', ['Sedimentary', 'Metamorphic', 'Fossil']],
    [3, 'What is the most common gas in Earth\'s air?', 'Nitrogen', ['Oxygen', 'Carbon dioxide', 'Argon']],
    [3, 'What kind of energy does a moving object have?', 'Kinetic energy', ['Potential energy', 'Nuclear energy', 'Chemical energy']],
    [3, 'What does DNA stand for?', 'Deoxyribonucleic acid', ['Dual nucleic acid', 'Dinitrogen acid', 'Deoxyribose nitrate']],
    [3, 'What is the pH of pure water?', '7', ['0', '5', '14']],
    [3, 'Which element has the atomic number 1?', 'Hydrogen', ['Helium', 'Oxygen', 'Carbon']],
    [4, 'Which metal has the highest melting point?', 'Tungsten', ['Titanium', 'Iron', 'Platinum']],
    [4, 'Roughly how fast does light travel?', '300,000 km per second', ['30,000 km per second', '3,000 km per second', '3 million km per second']],
    [4, 'What is the only metal that is liquid at room temperature?', 'Mercury', ['Lead', 'Gallium', 'Tin']],
  ],
  animals: [
    [1, 'What is the largest animal on Earth?', 'Blue whale', ['African elephant', 'Giraffe', 'Great white shark']],
    [1, 'How many legs does a spider have?', '8', ['6', '10', '12']],
    [1, 'What is a baby dog called?', 'A puppy', ['A kitten', 'A calf', 'A cub']],
    [1, 'Which animal has black and white stripes and lives in Africa?', 'Zebra', ['Panda', 'Skunk', 'Tiger']],
    [1, 'What do caterpillars turn into?', 'Butterflies', ['Bees', 'Beetles', 'Spiders']],
    [2, 'What is a baby kangaroo called?', 'A joey', ['A cub', 'A kit', 'A calf']],
    [2, 'Which bird is famous for copying human speech?', 'Parrot', ['Owl', 'Sparrow', 'Pelican']],
    [2, 'What is the fastest land animal?', 'Cheetah', ['Lion', 'Horse', 'Greyhound']],
    [2, 'Which mammal can truly fly?', 'Bat', ['Flying squirrel', 'Sugar glider', 'Lemur']],
    [2, 'What is a group of lions called?', 'A pride', ['A pack', 'A herd', 'A school']],
    [3, 'How many hearts does an octopus have?', '3', ['1', '2', '8']],
    [3, 'Which mammal lays eggs?', 'Platypus', ['Kangaroo', 'Armadillo', 'Hedgehog']],
    [3, 'What is the largest kind of shark?', 'Whale shark', ['Great white shark', 'Hammerhead shark', 'Tiger shark']],
    [3, 'What do pandas mostly eat?', 'Bamboo', ['Fish', 'Berries', 'Insects']],
    [4, 'What color is a polar bear\'s skin under its fur?', 'Black', ['White', 'Pink', 'Gray']],
    [4, 'Which animal has fingerprints almost identical to a human\'s?', 'Koala', ['Raccoon', 'Sloth', 'Otter']],
    [4, 'How many stomach compartments does a cow have?', '4', ['1', '2', '6']],
  ],
  space: [
    [1, 'What planet do we live on?', 'Earth', ['Mars', 'Venus', 'Jupiter']],
    [1, 'What is the closest star to Earth?', 'The Sun', ['Polaris', 'Sirius', 'The Moon']],
    [1, 'Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Mercury']],
    [1, 'Which planet is famous for its big rings?', 'Saturn', ['Mars', 'Earth', 'Mercury']],
    [1, 'What do we call the Moon when it looks like a whole circle?', 'A full moon', ['A new moon', 'A crescent moon', 'A half moon']],
    [2, 'Which is the largest planet in our solar system?', 'Jupiter', ['Saturn', 'Neptune', 'Earth']],
    [2, 'Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Mars', 'Earth']],
    [2, 'How many planets are in our solar system?', '8', ['7', '9', '10']],
    [2, 'What is the name of our galaxy?', 'The Milky Way', ['Andromeda', 'The Big Dipper', 'Orion']],
    [2, 'Who was the first person to walk on the Moon?', 'Neil Armstrong', ['Buzz Aldrin', 'Yuri Gagarin', 'John Glenn']],
    [2, 'What is a "shooting star" really?', 'A meteor', ['A falling star', 'A planet', 'A satellite']],
    [3, 'Who was the first human in space?', 'Yuri Gagarin', ['Neil Armstrong', 'Alan Shepard', 'John Glenn']],
    [3, 'Which planet spins on its side?', 'Uranus', ['Neptune', 'Saturn', 'Venus']],
    [3, 'Which planet is the hottest?', 'Venus', ['Mercury', 'Mars', 'Jupiter']],
    [3, 'Roughly how long does sunlight take to reach Earth?', 'About 8 minutes', ['About 8 seconds', 'About 8 hours', 'About a day']],
    [4, 'What is the largest volcano in the solar system?', 'Olympus Mons', ['Mauna Kea', 'Mount Etna', 'Valles Marineris']],
    [4, 'What is the larger of Mars\' two moons?', 'Phobos', ['Deimos', 'Titan', 'Europa']],
    [4, 'What sits at the center of the Milky Way?', 'A supermassive black hole', ['A giant star', 'A gas giant', 'Empty space']],
  ],
  body: [
    [1, 'Which organ pumps blood around the body?', 'The heart', ['The lungs', 'The liver', 'The brain']],
    [1, 'Which organs help you breathe?', 'The lungs', ['The kidneys', 'The stomach', 'The heart']],
    [1, 'How many fingers are on two hands, counting thumbs?', '10', ['8', '12', '9']],
    [1, 'Which body part do you use to taste?', 'The tongue', ['The nose', 'The ears', 'The cheeks']],
    [2, 'What is the largest organ of the human body?', 'The skin', ['The liver', 'The brain', 'The lungs']],
    [2, 'How many teeth does an adult usually have, including wisdom teeth?', '32', ['20', '28', '40']],
    [2, 'Which organs clean your blood and make urine?', 'The kidneys', ['The liver', 'The stomach', 'The heart']],
    [2, 'What do red blood cells carry around the body?', 'Oxygen', ['Food', 'Germs', 'Water']],
    [2, 'What is the colored part of the eye called?', 'The iris', ['The pupil', 'The retina', 'The cornea']],
    [3, 'How many bones are in the adult human body?', '206', ['186', '226', '256']],
    [3, 'Where is the smallest bone in the body?', 'In the ear', ['In the toe', 'In the finger', 'In the nose']],
    [3, 'The femur is in which part of the body?', 'The thigh', ['The arm', 'The skull', 'The foot']],
    [3, 'Which vitamin does your skin make in sunlight?', 'Vitamin D', ['Vitamin C', 'Vitamin A', 'Vitamin B12']],
    [4, 'Which part of the brain mainly controls balance?', 'The cerebellum', ['The frontal lobe', 'The brainstem', 'The hippocampus']],
    [4, 'About how many times a minute does a resting adult heart beat?', '60–100', ['10–20', '150–200', '200–250']],
  ],
  food: [
    [1, 'Which fruit is said to "keep the doctor away"?', 'Apple', ['Banana', 'Orange', 'Grape']],
    [1, 'Which country is pizza originally from?', 'Italy', ['France', 'United States', 'Greece']],
    [1, 'What is the main ingredient in guacamole?', 'Avocado', ['Tomato', 'Pepper', 'Lime']],
    [1, 'Which country is famous for croissants and baguettes?', 'France', ['Germany', 'Spain', 'Italy']],
    [1, 'Popcorn is made from which plant?', 'Corn', ['Rice', 'Wheat', 'Oats']],
    [2, 'Sushi comes from which country?', 'Japan', ['China', 'Korea', 'Thailand']],
    [2, 'What is tofu made from?', 'Soybeans', ['Rice', 'Milk', 'Wheat']],
    [2, 'What is the main ingredient of hummus?', 'Chickpeas', ['Lentils', 'Fava beans', 'Peas']],
    [2, 'Which nut is used to make marzipan?', 'Almond', ['Peanut', 'Walnut', 'Cashew']],
    [3, 'Which spice gives curry its yellow color?', 'Turmeric', ['Paprika', 'Cinnamon', 'Cumin']],
    [3, 'Which pasta is shaped like little bow ties?', 'Farfalle', ['Penne', 'Fusilli', 'Orzo']],
    [3, 'Which is the most expensive spice by weight?', 'Saffron', ['Vanilla', 'Cardamom', 'Black pepper']],
    [3, 'Which cheese is traditionally used on a classic Margherita pizza?', 'Mozzarella', ['Cheddar', 'Parmesan', 'Brie']],
    [4, 'Which part of a chili pepper holds most of the heat?', 'The white inner ribs', ['The seeds', 'The skin', 'The stem']],
    [4, 'Which fruit is called the "king of fruits" in Southeast Asia?', 'Durian', ['Mango', 'Jackfruit', 'Lychee']],
    [4, 'Kimchi is a fermented dish from which country?', 'Korea', ['Japan', 'Vietnam', 'Thailand']],
  ],
  landmarks: [
    [1, 'In which city is the Eiffel Tower?', 'Paris', ['London', 'Rome', 'Berlin']],
    [1, 'Which country is home to the Great Wall?', 'China', ['Japan', 'India', 'Mongolia']],
    [1, 'In which city is the Statue of Liberty?', 'New York City', ['Washington, D.C.', 'Boston', 'Philadelphia']],
    [1, 'Which country is home to the pyramids of Giza?', 'Egypt', ['Mexico', 'Greece', 'Peru']],
    [1, 'Which country is home to the Sydney Opera House?', 'Australia', ['New Zealand', 'England', 'Canada']],
    [2, 'In which city is the Colosseum?', 'Rome', ['Athens', 'Florence', 'Istanbul']],
    [2, 'The Taj Mahal is in which country?', 'India', ['Pakistan', 'Iran', 'Turkey']],
    [2, 'Big Ben is in which city?', 'London', ['Edinburgh', 'Dublin', 'Paris']],
    [2, 'Machu Picchu is in which country?', 'Peru', ['Chile', 'Mexico', 'Bolivia']],
    [2, 'Which Italian city has a famous leaning tower?', 'Pisa', ['Venice', 'Milan', 'Naples']],
    [2, 'Stonehenge is in which country?', 'England', ['Scotland', 'Ireland', 'Wales']],
    [3, 'The Christ the Redeemer statue overlooks which city?', 'Rio de Janeiro', ['Buenos Aires', 'Lisbon', 'São Paulo']],
    [3, 'Petra, the city carved into rock, is in which country?', 'Jordan', ['Egypt', 'Israel', 'Saudi Arabia']],
    [3, 'Angkor Wat is in which country?', 'Cambodia', ['Thailand', 'Vietnam', 'Laos']],
    [3, 'What is the tallest building in the world?', 'Burj Khalifa', ['Shanghai Tower', 'One World Trade Center', 'Taipei 101']],
    [4, 'Chichén Itzá was built by which civilization?', 'The Maya', ['The Aztec', 'The Inca', 'The Olmec']],
    [4, 'The Alhambra palace is in which country?', 'Spain', ['Morocco', 'Portugal', 'Turkey']],
  ],
  holidays: [
    [1, 'Which holiday is celebrated on December 25?', 'Christmas', ['Easter', 'Halloween', 'New Year\'s Day']],
    [1, 'On which holiday do kids go trick-or-treating?', 'Halloween', ['Thanksgiving', 'Easter', 'Valentine\'s Day']],
    [1, 'What do people often hunt for at Easter?', 'Eggs', ['Pumpkins', 'Presents', 'Shells']],
    [1, 'On which date is Valentine\'s Day?', 'February 14', ['March 17', 'October 31', 'January 1']],
    [2, 'Which holiday is known as the Festival of Lights in India?', 'Diwali', ['Holi', 'Eid', 'Hanukkah']],
    [2, 'How many nights does Hanukkah last?', '8', ['7', '10', '12']],
    [2, 'Which festival is famous for throwing colored powder?', 'Holi', ['Diwali', 'Carnival', 'Songkran']],
    [2, 'Which saint\'s day is celebrated on March 17?', 'Saint Patrick', ['Saint Nicholas', 'Saint George', 'Saint Valentine']],
    [2, 'Which U.S. holiday falls on the fourth Thursday of November?', 'Thanksgiving', ['Labor Day', 'Memorial Day', 'Veterans Day']],
    [2, 'What is the Muslim holy month of fasting called?', 'Ramadan', ['Eid', 'Hajj', 'Diwali']],
    [3, 'In which country did the Day of the Dead (Día de Muertos) begin?', 'Mexico', ['Spain', 'Brazil', 'Peru']],
    [3, 'Which country started the tradition of the Christmas tree?', 'Germany', ['England', 'Norway', 'United States']],
    [3, 'What is the Jewish New Year called?', 'Rosh Hashanah', ['Yom Kippur', 'Passover', 'Purim']],
    [3, 'Songkran, famous for water fights, is celebrated in which country?', 'Thailand', ['Japan', 'India', 'Philippines']],
    [4, 'Which holiday marks the end of Ramadan?', 'Eid al-Fitr', ['Eid al-Adha', 'Nowruz', 'Mawlid']],
    [4, 'Nowruz, the Persian New Year, begins on which kind of day?', 'The spring equinox', ['The winter solstice', 'The first full moon', 'The summer solstice']],
  ],
  mythology: [
    [1, 'Who is the king of the Greek gods?', 'Zeus', ['Poseidon', 'Hades', 'Apollo']],
    [1, 'Who is the Greek god of the sea?', 'Poseidon', ['Zeus', 'Ares', 'Hermes']],
    [2, 'In Norse myth, who carries a hammer called Mjölnir?', 'Thor', ['Odin', 'Loki', 'Freya']],
    [2, 'Which Egyptian creature has a lion\'s body and a human head?', 'The Sphinx', ['The Griffin', 'The Minotaur', 'The Centaur']],
    [2, 'What is the half-man, half-bull creature in the labyrinth?', 'The Minotaur', ['A centaur', 'A cyclops', 'A satyr']],
    [2, 'Which hero had only one weak spot: his heel?', 'Achilles', ['Hercules', 'Perseus', 'Odysseus']],
    [2, 'Which legendary king pulled the sword from the stone?', 'King Arthur', ['King Midas', 'King Leonidas', 'King Solomon']],
    [3, 'What is the Roman name for Zeus?', 'Jupiter', ['Mars', 'Neptune', 'Saturn']],
    [3, 'Who stole fire from the gods to give to humans?', 'Prometheus', ['Hermes', 'Icarus', 'Atlas']],
    [3, 'Who defeated Medusa by looking at her reflection?', 'Perseus', ['Theseus', 'Jason', 'Hercules']],
    [3, 'In Egyptian myth, which jackal-headed god guards the dead?', 'Anubis', ['Ra', 'Osiris', 'Horus']],
    [4, 'In Norse myth, what is the giant tree that connects the worlds?', 'Yggdrasil', ['Asgard', 'Valhalla', 'Bifröst']],
    [4, 'Which Greek figure flew too close to the sun on wax wings?', 'Icarus', ['Daedalus', 'Pegasus', 'Phaethon']],
  ],
  books: [
    [1, 'Who wrote the Harry Potter books?', 'J.K. Rowling', ['Roald Dahl', 'C.S. Lewis', 'J.R.R. Tolkien']],
    [1, 'What is the name of the boy who never grows up?', 'Peter Pan', ['Pinocchio', 'Oliver Twist', 'Tom Sawyer']],
    [1, 'In "Goldilocks", how many bears are there?', '3', ['2', '4', '7']],
    [1, 'What happens to Pinocchio\'s nose when he lies?', 'It grows', ['It turns red', 'It shrinks', 'It falls off']],
    [2, 'Who wrote "Romeo and Juliet"?', 'William Shakespeare', ['Charles Dickens', 'Jane Austen', 'Mark Twain']],
    [2, 'Who wrote "Charlie and the Chocolate Factory"?', 'Roald Dahl', ['Dr. Seuss', 'Beatrix Potter', 'E.B. White']],
    [2, 'Which detective lives at 221B Baker Street?', 'Sherlock Holmes', ['Hercule Poirot', 'Nancy Drew', 'Miss Marple']],
    [2, 'What is the name of the hobbit in "The Hobbit"?', 'Bilbo Baggins', ['Frodo Baggins', 'Samwise Gamgee', 'Pippin Took']],
    [3, 'Who wrote "Pride and Prejudice"?', 'Jane Austen', ['Charlotte Brontë', 'Mary Shelley', 'George Eliot']],
    [3, 'Which author created Winnie-the-Pooh?', 'A.A. Milne', ['Beatrix Potter', 'Lewis Carroll', 'Kenneth Grahame']],
    [3, 'Who wrote "1984"?', 'George Orwell', ['Aldous Huxley', 'Ray Bradbury', 'H.G. Wells']],
    [4, 'Who wrote "One Hundred Years of Solitude"?', 'Gabriel García Márquez', ['Isabel Allende', 'Jorge Luis Borges', 'Pablo Neruda']],
    [4, 'In "Moby-Dick", what is the name of the obsessed captain?', 'Captain Ahab', ['Captain Hook', 'Captain Nemo', 'Captain Flint']],
  ],
  art: [
    [1, 'Who painted the Mona Lisa?', 'Leonardo da Vinci', ['Michelangelo', 'Raphael', 'Vincent van Gogh']],
    [2, 'Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', ['Leonardo da Vinci', 'Donatello', 'Botticelli']],
    [2, 'Who painted "The Starry Night"?', 'Vincent van Gogh', ['Claude Monet', 'Pablo Picasso', 'Salvador Dalí']],
    [2, 'What are the three primary colors in painting?', 'Red, yellow, blue', ['Red, green, blue', 'Orange, green, purple', 'Black, white, gray']],
    [3, 'Which painter is known for melting clocks?', 'Salvador Dalí', ['René Magritte', 'Joan Miró', 'Frida Kahlo']],
    [3, 'Which artist is famous for paintings of soup cans?', 'Andy Warhol', ['Roy Lichtenstein', 'Jackson Pollock', 'Keith Haring']],
    [3, 'Which art style did Pablo Picasso help create?', 'Cubism', ['Impressionism', 'Surrealism', 'Pop Art']],
    [3, 'Who painted "The Scream"?', 'Edvard Munch', ['Gustav Klimt', 'Egon Schiele', 'Paul Klee']],
    [4, 'Which Dutch painter made "Girl with a Pearl Earring"?', 'Johannes Vermeer', ['Rembrandt', 'Frans Hals', 'Jan Steen']],
    [4, 'Which Mexican artist is famous for bold self-portraits?', 'Frida Kahlo', ['Diego Rivera', 'Rufino Tamayo', 'José Orozco']],
  ],
  tech: [
    [1, 'Who is most famous for inventing the light bulb?', 'Thomas Edison', ['Albert Einstein', 'Isaac Newton', 'Henry Ford']],
    [1, 'What does "AI" stand for?', 'Artificial Intelligence', ['Automatic Internet', 'Actual Information', 'Animated Image']],
    [2, 'What did Alexander Graham Bell invent?', 'The telephone', ['The radio', 'The television', 'The camera']],
    [2, 'Who were the first to fly a powered airplane?', 'The Wright brothers', ['The Lumière brothers', 'Charles Lindbergh', 'Amelia Earhart']],
    [2, 'What does "www" stand for in a web address?', 'World Wide Web', ['World Web Window', 'Wide Web World', 'Web Wire Works']],
    [2, 'What does "CPU" stand for?', 'Central Processing Unit', ['Computer Power Unit', 'Core Program Utility', 'Central Peripheral Unit']],
    [3, 'What does "USB" stand for?', 'Universal Serial Bus', ['United System Board', 'Universal Signal Box', 'User Serial Bridge']],
    [3, 'What does "HTML" stand for?', 'HyperText Markup Language', ['High Tech Modern Language', 'Hyperlink Text Machine Language', 'Home Tool Markup Language']],
    [4, 'Who invented the World Wide Web?', 'Tim Berners-Lee', ['Bill Gates', 'Steve Jobs', 'Vint Cerf']],
    [4, 'What does "GPS" stand for?', 'Global Positioning System', ['General Position Signal', 'Global Path Satellite', 'Geographic Pointing System']],
  ],
  sports: [
    [1, 'How many players does a soccer team have on the field?', '11', ['9', '10', '12']],
    [1, 'How many rings are on the Olympic flag?', '5', ['4', '6', '7']],
    [1, 'In which sport do you score a "home run"?', 'Baseball', ['Cricket', 'Basketball', 'Golf']],
    [2, 'Which sport uses the terms "strike" and "spare"?', 'Bowling', ['Baseball', 'Golf', 'Darts']],
    [2, 'How many points is a touchdown worth in American football?', '6', ['3', '7', '5']],
    [2, 'In tennis, what is a score of zero called?', 'Love', ['Nil', 'Zip', 'Duck']],
    [2, 'In which sport do you hit a shuttlecock?', 'Badminton', ['Tennis', 'Squash', 'Table tennis']],
    [3, 'Which country has won the most FIFA World Cups?', 'Brazil', ['Germany', 'Italy', 'Argentina']],
    [3, 'About how long is a marathon?', '42 km (26.2 miles)', ['21 km (13.1 miles)', '30 km (18.6 miles)', '50 km (31 miles)']],
    [3, 'In golf, what is one under par called?', 'A birdie', ['An eagle', 'A bogey', 'An albatross']],
    [4, 'How many players are on a rugby union team on the field?', '15', ['11', '13', '18']],
  ],
  vehicles: [
    [1, 'How many wheels does a bicycle have?', '2', ['3', '4', '1']],
    [1, 'Which vehicle runs on rails?', 'A train', ['A bus', 'A truck', 'A boat']],
    [1, 'What does "MPH" stand for?', 'Miles per hour', ['Meters per hour', 'Motors per hour', 'Miles past home']],
    [2, 'Which car company makes the Mustang?', 'Ford', ['Chevrolet', 'Dodge', 'Toyota']],
    [2, 'Which country is Ferrari from?', 'Italy', ['Germany', 'France', 'Spain']],
    [3, 'What is the front of a ship called?', 'The bow', ['The stern', 'The deck', 'The hull']],
    [3, 'What kind of vehicle is a Zeppelin?', 'An airship', ['A submarine', 'A race car', 'A tank']],
    [4, 'What does a car\'s tachometer measure?', 'Engine speed (RPM)', ['Fuel level', 'Tire pressure', 'Distance']],
  ],
  movies: [
    [1, 'Which movie has a snowman named Olaf?', 'Frozen', ['Tangled', 'Moana', 'Brave']],
    [1, 'What kind of animal is Simba in "The Lion King"?', 'A lion', ['A tiger', 'A cheetah', 'A leopard']],
    [1, 'What is the name of the green ogre in a 2001 animated film?', 'Shrek', ['Hulk', 'Grinch', 'Fiona']],
    [2, 'Which wizard school does Harry Potter attend?', 'Hogwarts', ['Narnia', 'Durmstrang', 'Camelot']],
    [2, 'In "Toy Story", what is the cowboy\'s name?', 'Woody', ['Buzz', 'Jessie', 'Andy']],
    [2, 'In "The Wizard of Oz", what color are Dorothy\'s slippers?', 'Ruby red', ['Silver', 'Gold', 'Emerald green']],
    [2, 'Which superhero is Tony Stark?', 'Iron Man', ['Captain America', 'Thor', 'Hawkeye']],
    [3, 'Which movie series features the line "May the Force be with you"?', 'Star Wars', ['Star Trek', 'The Matrix', 'Dune']],
    [3, 'Who directed "Jurassic Park"?', 'Steven Spielberg', ['James Cameron', 'George Lucas', 'Ridley Scott']],
    [4, 'Which film won the first Oscar for Best Animated Feature?', 'Shrek', ['Toy Story', 'Monsters, Inc.', 'Spirited Away']],
  ],
  tv: [
    [1, 'Which yellow cartoon family lives in Springfield?', 'The Simpsons', ['The Flintstones', 'The Griffins', 'The Jetsons']],
    [1, 'Who lives in a pineapple under the sea?', 'SpongeBob SquarePants', ['Patrick Star', 'Nemo', 'Ariel']],
    [2, 'Which show features a coffee shop called Central Perk?', 'Friends', ['Seinfeld', 'How I Met Your Mother', 'Frasier']],
    [2, 'In "Stranger Things", what is the name of the girl with powers?', 'Eleven', ['Max', 'Nancy', 'Robin']],
    [2, 'Which show features dragons and the Iron Throne?', 'Game of Thrones', ['The Witcher', 'Vikings', 'Merlin']],
    [3, 'Which show follows a chemistry teacher turned criminal?', 'Breaking Bad', ['Ozark', 'Better Call Saul', 'The Sopranos']],
    [3, 'Which show\'s characters work at Dunder Mifflin?', 'The Office', ['Parks and Recreation', 'Brooklyn Nine-Nine', 'Scrubs']],
  ],
  music: [
    [1, 'How many strings does a standard guitar have?', '6', ['4', '5', '8']],
    [1, 'Which instrument has black and white keys?', 'Piano', ['Violin', 'Trumpet', 'Drum']],
    [2, 'Which band sang "Hey Jude"?', 'The Beatles', ['The Rolling Stones', 'Queen', 'The Who']],
    [2, 'Who is known as the "King of Pop"?', 'Michael Jackson', ['Elvis Presley', 'Prince', 'Justin Timberlake']],
    [2, 'Who is known as the "King of Rock and Roll"?', 'Elvis Presley', ['Chuck Berry', 'Little Richard', 'Buddy Holly']],
    [3, 'How many keys does a standard piano have?', '88', ['76', '92', '64']],
    [3, 'Which composer kept writing music after going deaf?', 'Ludwig van Beethoven', ['Wolfgang Mozart', 'Johann Sebastian Bach', 'Frédéric Chopin']],
    [3, 'Who is known as the "Queen of Soul"?', 'Aretha Franklin', ['Diana Ross', 'Whitney Houston', 'Tina Turner']],
    [4, 'How many lines does a standard musical staff have?', '5', ['4', '6', '7']],
  ],
  theatre: [
    [1, 'Which musical is about the life of Alexander Hamilton?', 'Hamilton', ['Les Misérables', 'Wicked', 'Rent']],
    [2, 'Who wrote the play "Hamlet"?', 'William Shakespeare', ['Christopher Marlowe', 'Oscar Wilde', 'Arthur Miller']],
    [2, 'Which musical features a masked man living under the Paris Opera?', 'The Phantom of the Opera', ['Les Misérables', 'Cats', 'Chicago']],
    [3, 'Which musical features the song "Defying Gravity"?', 'Wicked', ['Hamilton', 'Rent', 'Annie']],
    [3, 'Which musical includes the song "Memory"?', 'Cats', ['Evita', 'Grease', 'Mamma Mia!']],
    [3, 'Which musical is built around ABBA songs?', 'Mamma Mia!', ['Grease', 'Hairspray', 'Jersey Boys']],
  ],
  games: [
    [1, 'What is the name of Nintendo\'s famous plumber hero?', 'Mario', ['Luigi', 'Link', 'Sonic']],
    [1, 'In which game do you build with blocks and avoid Creepers?', 'Minecraft', ['Roblox', 'Fortnite', 'Terraria']],
    [1, 'Which yellow electric Pokémon is Ash\'s partner?', 'Pikachu', ['Charmander', 'Squirtle', 'Bulbasaur']],
    [1, 'Which game is about fitting falling blocks into lines?', 'Tetris', ['Pac-Man', 'Snake', 'Pong']],
    [2, 'What color is Pac-Man?', 'Yellow', ['Red', 'Blue', 'Green']],
    [2, 'Which princess does Link often rescue?', 'Zelda', ['Peach', 'Daisy', 'Rosalina']],
    [2, 'Which company makes the PlayStation?', 'Sony', ['Nintendo', 'Microsoft', 'Sega']],
    [3, 'What is the name of Sonic\'s two-tailed fox friend?', 'Tails', ['Knuckles', 'Shadow', 'Amy']],
  ],
  boardgames: [
    [1, 'In which game do you say "Checkmate"?', 'Chess', ['Checkers', 'Monopoly', 'Scrabble']],
    [2, 'In Monopoly, how much do you collect for passing Go?', '$200', ['$100', '$150', '$500']],
    [2, 'Which chess piece can only move diagonally?', 'The bishop', ['The rook', 'The knight', 'The king']],
    [2, 'How many squares are on a chessboard?', '64', ['48', '72', '100']],
    [3, 'How many dots are on a standard die in total?', '21', ['18', '20', '24']],
    [3, 'Which word game uses letter tiles on a 15×15 board?', 'Scrabble', ['Boggle', 'Bananagrams', 'Wordle']],
    [4, 'In Scrabble, how many points is the letter Z worth?', '10', ['8', '5', '12']],
  ],
  cartoons: [
    [1, 'What kind of animal is Scooby-Doo?', 'A dog', ['A cat', 'A horse', 'A bear']],
    [1, 'Which cartoon cat is always chasing Jerry?', 'Tom', ['Garfield', 'Sylvester', 'Felix']],
    [1, 'What is the name of Mickey Mouse\'s girlfriend?', 'Minnie Mouse', ['Daisy Duck', 'Clarabelle Cow', 'Mabel']],
    [2, 'What do the Teenage Mutant Ninja Turtles love to eat?', 'Pizza', ['Tacos', 'Burgers', 'Sushi']],
    [2, 'What is Bugs Bunny\'s famous catchphrase?', '"What\'s up, Doc?"', ['"Yabba dabba doo!"', '"Cowabunga!"', '"D\'oh!"']],
    [2, 'In "Phineas and Ferb", what kind of animal is Perry?', 'A platypus', ['A beaver', 'An otter', 'A duck']],
  ],
  comics: [
    [1, 'What is Superman\'s big weakness?', 'Kryptonite', ['Fire', 'Water', 'Gold']],
    [2, 'Which city does Batman protect?', 'Gotham City', ['Metropolis', 'Star City', 'Central City']],
    [2, 'What is Spider-Man\'s real name?', 'Peter Parker', ['Bruce Wayne', 'Clark Kent', 'Tony Stark']],
    [2, 'Which superhero comes from Wakanda?', 'Black Panther', ['Storm', 'Falcon', 'Shuri']],
    [3, 'What is the name of Thor\'s hammer?', 'Mjölnir', ['Stormbreaker', 'Gungnir', 'Excalibur']],
    [4, 'What is Wonder Woman\'s home island called?', 'Themyscira', ['Atlantis', 'Krypton', 'Avalon']],
  ],
  anime: [
    [2, 'Who is the hero of "Dragon Ball"?', 'Goku', ['Naruto', 'Luffy', 'Ichigo']],
    [2, 'Which Studio Ghibli film features a forest spirit named Totoro?', 'My Neighbor Totoro', ['Spirited Away', 'Ponyo', 'Princess Mononoke']],
    [3, 'In "One Piece", what does Luffy want to become?', 'King of the Pirates', ['A Hokage', 'A Pokémon master', 'A Hunter']],
    [3, 'In "Naruto", what title does Naruto dream of earning?', 'Hokage', ['Shogun', 'Samurai', 'Kage of Sand']],
    [3, 'Who directed "Spirited Away"?', 'Hayao Miyazaki', ['Isao Takahata', 'Makoto Shinkai', 'Mamoru Hosoda']],
  ],
};

// ── Filter: drop trivia that's too specific to be fun ──────────────
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const DATE_Q = /\b(what|which|in what) year\b|\bwhen (was|were|did|is)\b|\brelease date\b|\bwhat date\b|\bwhich decade\b|\bhow many years\b|\bwhat century\b|\byear (was|did)\b/i;
const NICHE_Q = /\bepisode\b|\bseason \d|\bwhich album\b|\btrack (number|listing)\b|\bb-side\b|\bjersey number\b|\bvoice actor\b|\bvoiced by\b|\bdeveloper of\b|\bpublisher\b|\bsoundtrack\b|\bcomposer of the\b|\bdebut album\b|\bcatchphrase of the character\b/i;
const DATE_A = new RegExp(`^\\s*(\\d{3,4}s?|\\d{1,2}(st|nd|rd|th)? century|(${MONTHS})\\b.*|\\d{1,2} (${MONTHS}).*)\\s*$`, 'i');
export function tooSpecific(prompt, correct, wrongs = []) {
  if (DATE_Q.test(prompt) || NICHE_Q.test(prompt)) return true;
  if ([correct, ...wrongs].some((a) => DATE_A.test(a))) return true;
  if (/\d{1,3}(,\d{3}){2,}|\d{6,}/.test(correct)) return true;      // huge exact numbers
  if (prompt.length > 190) return true;
  if (/which of these|which of the following/i.test(prompt) && /not\b/i.test(prompt) && prompt.length > 120) return true;
  return false;
}

// ── Auto hints for questions without their own ──────────────────
function mask(word, reveal) {
  return [...word].map((ch, i) => (/[\p{L}\p{N}]/u.test(ch) ? (reveal(i, word.length) ? ch : '_') : ch)).join(' ');
}
export const answerText = (a) => (typeof a === 'string' ? a : a.text || '');
export function hintsFor(q) {
  if (q.hints && q.hints.length) return q.hints;
  const ans = answerText(q.answers[q.correct]);
  const words = ans.split(/\s+/).filter(Boolean);
  const isNum = /^[\d.,%°$¢\s–-]+$/.test(ans);
  const subject = q.subtopic || q.topicName || 'this';
  if (isNum) return [`It's about ${subject}. The answer is a number.`, `It starts with ${ans.trim()[0]}.`, `It's ${ans.trim().length > 2 ? 'close to ' : ''}${ans.trim().slice(0, Math.ceil(ans.trim().length / 2))}…`];
  return [
    `It's about ${subject}. The answer is ${words.length} word${words.length > 1 ? 's' : ''}: ${words.map((w) => mask(w, () => false)).join('   ')}`,
    `It looks like: ${words.map((w) => mask(w, (i) => i === 0)).join('   ')}`,
    `Nearly there: ${words.map((w) => mask(w, (i, n) => i === 0 || i % 2 === 0 || i === n - 1)).join('   ')}`,
  ];
}

const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

export class QuestionSource {
  constructor() {
    this.pools = {};                       // "topic|tier" → [question]
    this.seen = new Set(store.get('noah_seen', []));
    this.blocked = new Set(store.get('noah_blocked', []));
    this.missed = store.get('noah_missed', []);
    this.recent = [];
    this.token = null;
    this.online = typeof navigator === 'undefined' || navigator.onLine !== false;
    this.topics = [...ALL_TOPIC_IDS];
    this.fetchState = {};                  // topic → { amount, done }
    this.running = false;
    this.lastCall = 0;
  }

  // ── Test mode: every question is the same placeholder ──
  get testMode() { return store.get('noah_test', false) === true; }
  set testMode(on) { store.set('noah_test', !!on); }
  testQuestion(tier, topic) {
    return { id: 'TEST', kind: 'trivia', source: 'test', topic, topicName: 'Test Mode', subtopic: 'Test Mode', tier, test: true,
      prompt: 'Questions: Testing in progress', answers: ['Answer', 'Wrong', 'Wrong', 'Wrong'], correct: 0,
      hints: ['Test hint 1: it is not "Wrong".', 'Test hint 2: it starts with A.', 'Test hint 3: pick A.'] };
  }

  setTopics(ids) {
    this.topics = ids.filter((id) => TOPICS[id]);
    if (!this.topics.length) this.topics = [...ALL_TOPIC_IDS];
    this.startFetching();
  }

  async warmUp() {
    if (!this.online || this.token) return;
    try { this.token = (await (await fetch(`${TOKEN_API}?command=request`)).json()).token; } catch { /* fine without a token */ }
  }

  // Cycle through enabled Open Trivia DB topics, one request every ~5s (their limit).
  async startFetching() {
    if (this.running || !this.online) return;
    this.running = true;
    await this.warmUp();
    while (this.online) {
      const need = this.topics.filter((t) => TOPICS[t].src === 'otdb' && !this.fetchState[t]?.done && this.poolSize(t) < 12);
      if (!need.length) { await sleep(4000); continue; }
      need.sort((a, b) => this.poolSize(a) - this.poolSize(b));
      await this.fetchTopic(need[0]);
    }
    this.running = false;
  }
  poolSize(topic) { return [1, 2, 3].reduce((n, t) => n + (this.pools[`${topic}|${t}`]?.length || 0), 0); }

  async fetchTopic(topic) {
    const st = (this.fetchState[topic] ||= { amount: 50, cat: 0, done: false });
    const cats = TOPICS[topic].otdb;
    const cat = cats[st.cat++ % cats.length];
    const wait = 5200 - (Date.now() - this.lastCall);
    if (wait > 0) await sleep(wait);
    this.lastCall = Date.now();
    try {
      const url = `${API}?amount=${st.amount}&type=multiple&encode=url3986&category=${cat}${this.token ? '&token=' + this.token : ''}`;
      const data = await (await fetch(url)).json();
      if (data.response_code === 1) { st.amount = Math.floor(st.amount / 2); if (st.amount < 5) st.done = true; return; }
      if (data.response_code === 4) { st.done = true; return; }             // exhausted for this session
      if (data.response_code === 5) { await sleep(5000); return; }          // rate limited
      let kept = 0;
      for (const r of data.results || []) {
        const correct = dec(r.correct_answer);
        const wrongs = r.incorrect_answers.map(dec);
        const prompt = dec(r.question);
        const id = 'OTDB-' + hash(prompt);
        if (this.seen.has(id) || this.blocked.has(id) || tooSpecific(prompt, correct, wrongs)) continue;
        const answers = shuffle([correct, ...wrongs]);
        const tier = OTDB_TIER[r.difficulty] || 2;
        const [, sub] = dec(r.category).split(': ');
        (this.pools[`${topic}|${tier}`] ||= []).push({ id, kind: 'trivia', source: 'otdb', topic, topicName: TOPICS[topic].name, subtopic: sub || TOPICS[topic].name, tier, prompt, answers, correct: answers.indexOf(correct) });
        kept++;
      }
      if (!kept && st.amount <= 10) st.done = true;
    } catch {
      this.online = false;                     // offline or blocked: use the bank, try again later
      setTimeout(() => { this.online = true; this.startFetching(); }, 30000);
    }
  }

  markSeen(q) {
    if (q.test || q.source === 'gen' && !/^(RID|EMO)-/.test(q.id)) return;
    this.seen.add(q.id);
    this.recent = [q.id, ...this.recent].slice(0, 60);
    store.set('noah_seen', [...this.seen].slice(-4000));
  }
  markMissed(q) {
    if (q.test || q.source === 'gen') return;
    this.missed = [q, ...this.missed.filter((m) => m.id !== q.id)].slice(0, 40);
    store.set('noah_missed', this.missed);
  }
  markRight(q) {
    const n = this.missed.length;
    this.missed = this.missed.filter((m) => m.id !== q.id);
    if (n !== this.missed.length) store.set('noah_missed', this.missed);
  }
  // "Too obscure" flag: never show this question again
  block(q) {
    if (q.test) return;
    this.blocked.add(q.id);
    store.set('noah_blocked', [...this.blocked]);
    this.missed = this.missed.filter((m) => m.id !== q.id);
    store.set('noah_missed', this.missed);
  }

  bankFor(topic) {
    return (BANK[topic] || []).map(([tier, prompt, correct, wrongs], i) => {
      const answers = shuffle([correct, ...wrongs]);
      return { id: `BANK-${topic}-${i}`, kind: 'trivia', source: 'bank', topic, topicName: TOPICS[topic]?.name, subtopic: TOPICS[topic]?.name, tier, prompt, answers, correct: answers.indexOf(correct) };
    }).filter((q) => !this.blocked.has(q.id));
  }

  // Get a question for a topic at (roughly) a tier.
  get(tier, topic, opts = {}) {
    tier = Math.max(1, Math.min(4, Math.round(tier)));
    if (!TOPICS[topic]) topic = pick(this.topics);
    if (this.testMode) return this.testQuestion(tier, topic);
    const def = TOPICS[topic];
    if (def.src === 'gen') return { ...generate(topic, tier, this.recentSet()), topicName: def.name };

    // Questions you missed come back now and then
    if (!opts.noRepeat && Math.random() < 0.08) {
      const m = this.missed.find((x) => x.topic === topic && Math.abs(x.tier - tier) <= 1 && !this.recent.includes(x.id) && !this.blocked.has(x.id));
      if (m) return { ...m, answers: [...m.answers], returning: true };
    }
    // Open Trivia DB pool, closest tier first (tier 4 uses their "hard")
    const order = [Math.min(3, tier), Math.min(3, tier) - 1, Math.min(3, tier) + 1].filter((t) => t >= 1 && t <= 3);
    if (def.src === 'otdb') for (const t of order) {
      const pool = this.pools[`${topic}|${t}`];
      if (pool && pool.length) return pool.shift();
    }
    // Hand-written bank: unseen first, nearest tier
    const bank = this.bankFor(topic);
    const byTier = (list) => list.sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier) || Math.random() - 0.5);
    const fresh = byTier(bank.filter((q) => !this.seen.has(q.id) && !this.recent.includes(q.id)));
    if (fresh.length && Math.abs(fresh[0].tier - tier) <= 1) return pick(fresh.filter((q) => q.tier === fresh[0].tier));
    const notRecent = byTier(bank.filter((q) => !this.recent.includes(q.id)));
    if (notRecent.length && Math.abs(notRecent[0].tier - tier) <= 1) return pick(notRecent.filter((q) => q.tier === notRecent[0].tier));
    // Topic ran dry: borrow another enabled topic
    if (!opts.borrowed) {
      const others = shuffle(this.topics.filter((t) => t !== topic));
      for (const t of others) {
        const q = this.get(tier, t, { ...opts, borrowed: true });
        if (q) return q;
      }
    }
    return opts.borrowed ? null : (notRecent[0] || bank[0] || { ...generate('logic', tier), topicName: TOPICS.logic.name });
  }
  recentSet() { return new Set(this.recent); }
}
