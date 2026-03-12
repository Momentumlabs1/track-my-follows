// Auto-generated gender detection with 1,677+ names
// Covers: DE, EN, TR, AR, Slavic, IT, ES/PT, FR, Scandinavian, Asian, African, Persian
// Last updated: 2026-03-12

const FEMALE_NAMES = new Set([
  "aaliyah", "abeer", "abena", "abigail", "ada", "adaeze", "addison", "adela", "adele", "adjoa", "adriana", "adwoa", "afaf", "afia", "agathe",
  "agnes", "agniezska", "aiko", "aisha", "aissatou", "akua", "alara", "alba", "alejandra", "aleksandra", "alessandra", "alessia", "alexandra", "alexis", "alice",
  "alicia", "alina", "aline", "alla", "alma", "alva", "ama", "amaka", "amanda", "amara", "amber", "amelia", "amelie", "amina", "aminata",
  "amira", "amy", "ana", "anais", "ananya", "anastasia", "anette", "angela", "angelika", "anika", "anita", "anja", "anjali", "anke", "ann",
  "anna", "anne", "anneliese", "annette", "anni", "annie", "annika", "antje", "antonella", "antonia", "apolline", "april", "aria", "arianna", "arzu",
  "ashley", "asia", "asli", "asma", "astrid", "asya", "aubrey", "audrey", "aurora", "aurore", "autumn", "ava", "ayanda", "aylin", "ayse",
  "banu", "barbara", "barbora", "basma", "bayan", "beata", "beate", "beatrice", "beatriz", "belgin", "bella", "beren", "bernice", "bertha", "betty",
  "betul", "beverly", "bianca", "binta", "birgit", "birgitte", "birsen", "birte", "bojana", "bonnie", "brenda", "brianna", "brigitte", "brittany", "brooke",
  "brooklyn", "bruna", "burcu", "bushra", "busra", "camila", "camilla", "camille", "cansu", "capucine", "cara", "carina", "carla", "carlotta", "carmen",
  "carol", "carolina", "caroline", "carolyn", "carrie", "cassandra", "catalina", "catherine", "cathy", "cecilia", "celina", "celine", "cemile", "ceren", "chantal",
  "charlotte", "cheryl", "chiamaka", "chiara", "chioma", "chloe", "christina", "christine", "cigdem", "cindy", "cintia", "claire", "clara", "claudia", "clemence",
  "colette", "connie", "constance", "constanza", "constanze", "corinne", "cornelia", "courtney", "crystal", "cynthia", "dagmar", "dalal", "damla", "dana", "daniela",
  "danielle", "daria", "darlene", "dawn", "debbie", "debora", "deborah", "debra", "deepa", "defne", "delphine", "denise", "derin", "derya", "destiny",
  "devi", "diana", "diane", "dilara", "dilek", "dina", "divya", "dolores", "dominika", "donna", "dora", "doris", "dorota", "dorothea", "dorothy",
  "dorthe", "dragana", "duaa", "duygu", "ebba", "ebru", "ece", "ecrin", "edda", "edith", "edna", "efua", "ekaterina", "elaine", "eleanor",
  "elena", "eleonora", "elfriede", "elif", "elisa", "elisabeth", "elizabeth", "elke", "ella", "ellen", "ellie", "eloise", "elsa", "emilia", "emily",
  "emine", "emma", "erica", "erika", "erin", "esi", "esra", "esraa", "esther", "ethel", "eun", "eva", "evelina", "evelyn", "everly",
  "ewa", "eylul", "fabiana", "fabienne", "faith", "fang", "farida", "fatimah", "fatma", "fatou", "federica", "feride", "fernanda", "filiz", "finja",
  "fiona", "flavia", "flora", "florence", "frances", "francesca", "francoise", "franziska", "frauke", "freja", "frieda", "fulya", "gabriela", "gaia", "gail",
  "galina", "gamze", "garance", "genesis", "geraldine", "gertrud", "ghada", "gilmara", "ginevra", "giorgia", "gisela", "gita", "giulia", "gizem", "gladys",
  "gloria", "gonca", "gordana", "grace", "grazia", "grazyna", "greta", "guadalupe", "gudrun", "gul", "gulcan", "gulsah", "gulsen", "habiba", "hadeel",
  "hale", "halima", "halina", "hana", "hande", "haneen", "hanna", "hannah", "hannelore", "harper", "haruka", "hatice", "hazal", "hazel", "heather",
  "hedda", "heidi", "heike", "helen", "helena", "helga", "hilda", "hildegard", "hope", "huda", "hui", "hulya", "hye", "ida", "ifunanya",
  "ilaria", "ilknur", "ilse", "iman", "inaam", "indira", "ines", "inga", "ingeborg", "ingrid", "inna", "ipek", "irem", "irene", "irina",
  "iris", "irmgard", "isabel", "isabella", "isabelle", "isha", "isra", "ivana", "iveta", "ivy", "iwona", "jacqueline", "jade", "jadwiga", "jamie",
  "jamila", "jana", "jane", "janet", "janice", "jasmin", "jasmina", "jeanne", "jelena", "jennifer", "jenny", "jessica", "ji", "jill", "jimena",
  "jing", "joan", "joann", "joanne", "johanna", "jolanta", "josefina", "josephine", "joud", "joyce", "juanita", "judith", "judy", "jule", "julia",
  "juliana", "julie", "juliette", "jumana", "jung", "jutta", "kadiatou", "kamala", "karen", "karima", "karin", "karina", "karolina", "karoline", "katarina",
  "katarzyna", "katharina", "katherine", "kathleen", "kathrin", "kathryn", "kathy", "katrin", "kavya", "kawther", "kayla", "keiko", "kelly", "kendra", "kennedy",
  "kerstin", "kevser", "khadija", "kim", "kinsley", "kirsten", "klara", "kristina", "krystyna", "ksenia", "kubra", "laetitia", "lakshmi", "lale", "lalita",
  "lamia", "lara", "larisa", "larissa", "latifa", "laura", "layla", "lea", "leah", "lena", "leni", "lenka", "leonie", "leonora", "lerato",
  "leslie", "leticia", "leyla", "lia", "lieselotte", "lillian", "lily", "lin", "lina", "linda", "ling", "linnea", "lisa", "liv", "ljiljana",
  "lois", "lone", "lorena", "lori", "lorraine", "lotta", "lotte", "louise", "lubna", "lucia", "luciana", "lucie", "lucille", "lucy", "ludovica",
  "luisa", "luise", "lujain", "luna", "lynn", "lyudmila", "macarena", "mackenzie", "madeleine", "madison", "magdalena", "maike", "mais", "maja", "makayla",
  "malak", "malgorzata", "malin", "manal", "mandy", "manon", "manuela", "mara", "maren", "margaret", "margarete", "margaux", "margherita", "margit", "marguerite",
  "maria", "mariam", "mariama", "mariana", "marianne", "marie", "marilyn", "marina", "marine", "marjorie", "marketa", "marlene", "marta", "martha", "martina",
  "mary", "maryam", "masal", "mathilda", "mathilde", "matilde", "maya", "meera", "megan", "mei", "meike", "melanie", "melek", "melissa", "meltem",
  "mercedes", "merle", "merve", "meryem", "mette", "mia", "michelle", "mila", "milagros", "mildred", "milena", "min", "mine", "miray", "miriam",
  "mirjana", "molly", "mona", "monica", "monika", "monique", "morgan", "muge", "munira", "nabila", "nadezhda", "nadia", "nadine", "naima", "najwa",
  "naledi", "nancy", "naomi", "natalia", "natalie", "natascha", "natasha", "nathalie", "nawal", "naz", "nazli", "necla", "neha", "nehir", "nele",
  "nermin", "nese", "neslihan", "nevaeh", "ngozi", "nicole", "nihal", "nikolina", "nina", "nisha", "nneka", "noa", "noemi", "nomsa", "noor",
  "nora", "norma", "noura", "nova", "nur", "nuray", "nurgul", "oceane", "odette", "olga", "olivia", "oliwia", "oxana", "oya", "ozge",
  "ozlem", "padma", "paige", "paisley", "palesa", "paloma", "pamela", "paola", "parvati", "patricia", "patrizia", "patrycja", "paula", "paulina", "pauline",
  "peggy", "pembe", "penelope", "pernille", "petra", "phyllis", "pia", "pilar", "pinar", "ping", "polina", "pooja", "priscila", "priya", "rabia",
  "rachel", "radha", "rafaela", "rahma", "raisa", "rana", "rania", "raquel", "rawia", "razan", "rebecca", "reem", "regina", "renata", "renate",
  "rhonda", "rikke", "riley", "rita", "riya", "roberta", "rocio", "romane", "romy", "ronja", "rosa", "rose", "rosemarie", "ruby", "runa",
  "ruth", "rüya", "sabine", "safiya", "saga", "sahar", "sahika", "saja", "sakura", "sally", "salma", "samantha", "samira", "sandra", "sandrine",
  "sanja", "sara", "sarah", "savannah", "scarlett", "seda", "selin", "selina", "selma", "serap", "serena", "serenity", "serpil", "sevda", "severine",
  "sevgi", "sevim", "seyma", "shahd", "shannon", "sharon", "sheila", "sherry", "shirley", "sibel", "sidra", "sierra", "signe", "sigrid", "silje",
  "silke", "silvia", "simge", "simona", "sinem", "sita", "skylar", "snezana", "sofia", "soledad", "solveig", "songul", "sonja", "soo", "sophia",
  "sophie", "souad", "stefanie", "steffi", "stella", "stephanie", "stine", "suha", "suki", "sule", "sumeyye", "sun", "sunita", "sureyya", "susan",
  "susanne", "suzanne", "svenja", "svetlana", "swati", "sylvia", "sylvie", "sylwia", "tahani", "tala", "tamara", "tammy", "tanja", "tasnim", "tatiana",
  "tatjana", "taylor", "teresa", "tereza", "thais", "thandiwe", "thea", "thelma", "theresa", "therese", "tiffany", "tilda", "tina", "tove", "tracy",
  "trine", "trinity", "tuba", "tugba", "tulay", "tuqa", "turkan", "tuva", "uma", "umut", "ursula", "valentina", "valeria", "valerie", "vanessa",
  "vera", "veronica", "veronika", "veronique", "vesna", "victoire", "victoria", "vidya", "viktoria", "vildan", "viola", "violet", "virginia", "virginie", "vittoria",
  "viviane", "vivien", "wafa", "waltraud", "wanda", "wardah", "wendy", "widad", "wiebke", "willow", "wilma", "xiao", "ximena", "yagmur", "yan",
  "yara", "yasemin", "yasmin", "yeliz", "yeon", "yildiz", "ylva", "yoko", "yulia", "yun", "yvonne", "zahra", "zainab", "zanele", "zehra",
  "zeliha", "zeynep", "zoe", "zoey", "zofia", "zorica", "zoya", "zuhal", "zumrut", "zuzanna",
  // Additional Turkish/Arabic/Persian female names for DACH market
  "aysegul", "bahar", "belma", "ceyda", "ceylan", "deniz", "didem", "elifsu", "emel", "feray",
  "feryal", "figen", "gonul", "gulbahar", "gulizar", "gulseren", "gulsum", "hacer", "hafsa", "hanife",
  "havva", "hediye", "hilal", "hülya", "inci", "jale", "kader", "kamile", "kadriye", "kezban",
  "kubra", "latife", "leyla", "mehtap", "meral", "meryem", "munevver", "müge", "nazan", "nefise",
  "neslihan", "nesrin", "nigar", "nilufer", "nuran", "nurcan", "nursel", "pelin", "perihan", "reyhan",
  "ruqaya", "sabiha", "saliha", "saniye", "seher", "selda", "semra", "senay", "sevil", "sevtap",
  "seyhan", "sibel", "sultan", "sureyya", "süreyya", "sahika", "sehnaz", "sekure", "tülay", "vildan",
  "yasemin", "yildiz", "zehra", "zekiye", "zubeyde",
  // Persian female names
  "anahita", "azadeh", "darya", "elnaz", "fatemeh", "fereshteh", "ghazal", "golnaz", "laleh", "leila",
  "mahsa", "maryam", "mastaneh", "mina", "nasrin", "neda", "niloofar", "parisa", "parinaz", "roya",
  "sahar", "sepideh", "shadi", "shaghayegh", "shirin", "simin", "sogol", "taraneh", "yasaman", "zahra",
  // Arabic female names
  "abeer", "alia", "daliya", "dania", "farah", "firdaus", "ghufran", "hala", "hanan", "hayat",
  "inas", "kawkab", "khawla", "lama", "lubna", "madiha", "maisa", "marwa", "maysa", "nabiha",
  "nadiya", "nihad", "rabab", "rasha", "rawda", "rim", "ruba", "ruqayya", "sabah", "safa",
  "samah", "sawsan", "siham", "sumaya", "taghreed", "warda", "widad", "yumna", "zainab", "zubayda",
]);

const MALE_NAMES = new Set([
  "aaron", "abdallah", "abdul", "abdullah", "achim", "adam", "adel", "adrian", "ahmad", "ahmed", "ahmet", "aiden", "ajay", "akira", "alain",
  "alan", "albert", "alberto", "albrecht", "alejandro", "alessandro", "alexander", "alexandre", "alexei", "ali", "alp", "alperen", "alvaro", "amadou", "amin",
  "amir", "amit", "anas", "anatoly", "anders", "andre", "andreas", "andrei", "andres", "andrew", "angel", "angelo", "anil", "anthony", "antoine",
  "anton", "antonio", "anwar", "aras", "arda", "arjun", "armin", "arnaud", "arne", "artem", "arthur", "arturo", "arvid", "asher", "ashok",
  "austin", "aws", "axel", "badr", "baptiste", "baraa", "baris", "bartosz", "bassam", "bastian", "batuhan", "bekir", "ben", "benedikt", "benjamin",
  "benoit", "berk", "berke", "bernard", "bernd", "bernhard", "bilal", "billy", "bjorn", "björn", "blake", "bobby", "bogdan", "bojan", "bongani",
  "bora", "boris", "brandon", "branko", "brayden", "brett", "brian", "brody", "bruce", "bruno", "bryan", "burak", "cagri", "caio", "caleb",
  "cameron", "can", "carl", "carlo", "carlos", "carson", "carsten", "carter", "cedric", "cem", "cemal", "cesar", "cezary", "chad", "charles",
  "chase", "chen", "chidi", "christian", "christoph", "christophe", "christopher", "chukwu", "cinar", "clarence", "claude", "claudio", "clemens", "clement", "cody",
  "cole", "colton", "connor", "cooper", "corey", "cornelius", "cristian", "dalibor", "dalton", "damian", "damien", "daniel", "daniele", "darko", "darren",
  "david", "davide", "dawid", "declan", "deepak", "dejan", "denis", "dennis", "derek", "detlef", "didier", "diego", "dieter", "dinesh", "dirk",
  "dmitri", "dominic", "dominik", "donald", "dong", "doruk", "douglas", "dragan", "drew", "dusan", "dylan", "easton", "eberhard", "edoardo", "eduardo",
  "edvin", "edward", "ege", "egon", "einar", "elias", "elijah", "emanuel", "emanuele", "emeka", "emil", "emilio", "emir", "emmanuel", "emmett",
  "emre", "enes", "enrico", "enrique", "erdem", "eric", "erik", "erkan", "ernesto", "ernst", "ersin", "erwin", "espen", "esteban", "ethan",
  "eugen", "eugene", "evgeny", "eyad", "eymen", "fabian", "fabio", "fabrice", "faisal", "farid", "faris", "faruk", "federico", "felipe", "felix",
  "ferdinand", "ferhat", "fernando", "fikret", "filip", "filippo", "finn", "florian", "francesco", "francisco", "francois", "frank", "franz", "frederic", "frey",
  "friedrich", "furkan", "fyodor", "gabriel", "ganesh", "gary", "gavin", "geir", "gennadiy", "georg", "george", "gerald", "gerard", "gerhard", "ghaith",
  "giacomo", "gilles", "giorgio", "giovanni", "girish", "giuseppe", "gokhan", "gokmen", "gonzalo", "goran", "gottfried", "grant", "grayson", "gregory", "grigori",
  "grzegorz", "guilherme", "guillaume", "guillermo", "gunnar", "gustav", "günter", "hakan", "hakon", "halil", "hamid", "hamza", "hani", "hans", "harish",
  "harold", "harry", "hartmut", "hasan", "hassan", "hatem", "havard", "hazem", "hector", "heiko", "heinrich", "heinz", "helmut", "hendrik", "henri",
  "henrique", "henry", "herbert", "hikmet", "hiroshi", "hjalmar", "ho", "holger", "horst", "huang", "hubert", "hudson", "hugo", "hunter", "huseyin",
  "hussein", "hyun", "ian", "ibrahim", "ibrahima", "idris", "ifeanyi", "ignacio", "igor", "ilhan", "ilker", "ilya", "imad", "ingo", "ingvar",
  "irfan", "isaiah", "isam", "ismail", "issa", "ivan", "ivar", "jacek", "jack", "jackson", "jacob", "jacques", "jad", "jae", "jaime",
  "jakob", "jakub", "jamal", "james", "jan", "jannik", "jason", "javier", "jayden", "jayesh", "jeffrey", "jens", "jeremy", "jerry", "jesse",
  "jihad", "jin", "joachim", "joakim", "joao", "joaquin", "jochen", "joe", "johann", "johannes", "john", "johnny", "jonas", "jonathan", "jordan",
  "jorge", "jose", "josef", "joseph", "joshua", "juan", "julian", "julien", "jun", "justin", "jürgen", "kaan", "kadir", "kai", "kamal",
  "kamil", "kareem", "karim", "karl", "karol", "keith", "kemal", "ken", "kenji", "kenneth", "kerem", "kevin", "khaled", "khalid", "kilian",
  "kirill", "klaus", "knut", "kofi", "koji", "kojo", "konrad", "konstantin", "koray", "krishna", "kristian", "krzysztof", "kumar", "kurt", "kwabena",
  "kwaku", "kwame", "kwesi", "kyle", "laith", "lance", "landon", "larry", "lars", "lasse", "laurent", "lawrence", "leif", "leo", "leon",
  "leonard", "leonardo", "leonid", "leopold", "lev", "levent", "li", "liam", "lincoln", "linus", "liu", "logan", "loic", "loke", "lorenz",
  "lorenzo", "lothar", "louis", "luca", "lucas", "ludvig", "ludwig", "luis", "lukas", "lukasz", "luke", "maciej", "magnus", "maher", "mahir",
  "maik", "majid", "malek", "malte", "mamadou", "mandla", "manfred", "manoj", "mansour", "manuel", "marcel", "marcin", "marco", "marcos", "mario",
  "marius", "mark", "marko", "markus", "martin", "marwan", "mason", "massimo", "mateo", "mateusz", "matheus", "mathieu", "matteo", "matthew", "matthias",
  "matvei", "maverick", "max", "maxim", "maxime", "maximilian", "mehmet", "mesut", "mete", "metin", "michael", "michal", "michel", "miguel", "mikael",
  "mike", "mikhail", "milan", "miles", "milos", "ming", "miroslav", "mitchell", "moaz", "mohammed", "mohan", "mohannad", "moritz", "morten", "motaz",
  "moussa", "muhammad", "murad", "murat", "mustafa", "nabil", "nadir", "nasser", "nathan", "necati", "neil", "nenad", "nicholas", "nico", "nicolas",
  "nicolo", "nihat", "nikita", "niklas", "nikolai", "nils", "nizar", "nkosi", "nnamdi", "noah", "norbert", "nuri", "obada", "obinna", "odin",
  "oguz", "olaf", "ole", "oleg", "oliver", "olivier", "olof", "omar", "omer", "onur", "orhan", "osama", "oscar", "oskar", "osman",
  "otto", "ousmane", "owen", "oystein", "ozan", "ozcan", "ozgur", "pablo", "paolo", "parker", "pascal", "patrick", "paul", "pavel", "pawel",
  "pedro", "peer", "per", "petar", "peter", "philip", "philipp", "philippe", "pierre", "pietro", "piotr", "polat", "pontus", "predrag", "pyotr",
  "qasim", "quentin", "raed", "rafael", "rafal", "ragnar", "rahul", "rainer", "raj", "ralf", "ralph", "ramazan", "rami", "ramon", "randy",
  "raphael", "rashid", "rasmus", "raul", "ravi", "raymond", "recep", "reed", "reinhard", "rene", "riad", "ricardo", "riccardo", "richard", "rico",
  "ridvan", "riza", "robert", "roberto", "rodrigo", "roger", "rohit", "rolf", "romain", "roman", "ronald", "ronny", "roy", "rudolf", "rune",
  "ruslan", "russell", "ryan", "ryder", "ryu", "saad", "sahin", "said", "saleh", "salim", "salvador", "salvatore", "samer", "sami", "samir",
  "samuel", "sang", "sanjay", "santiago", "sasa", "sascha", "sawyer", "scott", "sebastian", "sedat", "sekou", "selim", "sercan", "serdar", "serge",
  "sergei", "sergio", "serhat", "seung", "shadi", "shane", "sharif", "siegfried", "sigmund", "sigurd", "silas", "simon", "sinan", "sipho", "slobodan",
  "soner", "spencer", "stanislav", "stefan", "stefano", "steffen", "stephane", "stephen", "steven", "suleyman", "sung", "sunil", "suresh", "sven", "sylvain",
  "szymon", "takeshi", "talal", "tamer", "tamim", "tarek", "tarik", "taro", "tendai", "terje", "terry", "thabo", "themba", "theo", "theodor",
  "thiago", "thierry", "thomas", "thor", "thorsten", "till", "tim", "timothy", "timur", "tobias", "tolga", "tom", "tomas", "tomasz", "tomislav",
  "tommaso", "torsten", "travis", "tristan", "trond", "troy", "tuncay", "tuncer", "turgut", "tyler", "uchenna", "ufuk", "ugur", "ulf", "umit",
  "usama", "utku", "uwe", "vadim", "valentin", "valery", "vasily", "vedat", "victor", "vidar", "vijay", "vikram", "viktor", "vincent", "vincenzo",
  "vinicius", "vinod", "vinzenz", "vitaly", "vladimir", "volkan", "volker", "wade", "wael", "walid", "walter", "wang", "warren", "wayne", "werner",
  "wilhelm", "willi", "william", "willie", "wojciech", "wolfgang", "woo", "wyatt", "xaver", "yang", "yannik", "yaroslav", "yasin", "yasser", "yavuz",
  "yaw", "yazan", "yigit", "younis", "youssef", "yuri", "yusuf", "yves", "zachary", "zafer", "zain", "zaki", "zbigniew", "zhang", "ziad",
  "zlatko", "zoran",
  // Additional Turkish/Arabic/Persian male names for DACH market
  "abdulkadir", "abdurrahman", "adnan", "akif", "alper", "anil", "ata", "atakan", "atilla", "ayhan",
  "aziz", "bahadir", "barbaros", "bayram", "bedri", "berat", "bilge", "cahit", "celal", "cengiz",
  "cuneyt", "davut", "dogan", "ebubekir", "ekrem", "elvan", "enver", "erdal", "erdogan", "ergun",
  "erhan", "erol", "ertugrul", "fahri", "fatih", "ferit", "fevzi", "fikri", "galip", "goksel",
  "gürkan", "habib", "halit", "hamdi", "hasan", "haydar", "hayri", "huseyin", "ilyas", "iskender",
  "ismet", "kenan", "koray", "kudret", "latif", "levent", "lutfi", "mahdi", "mahmoud", "mahmut",
  "mazhar", "mecit", "muammer", "mücahit", "müslüm", "naci", "nazim", "nedim", "nejat", "nevzat",
  "nihat", "numan", "nusret", "oğuz", "orçun", "osman", "polat", "raif", "rasim", "recai",
  "ridvan", "rüstem", "sabri", "sadik", "saffet", "salih", "sami", "savaş", "selahattin", "selçuk",
  "semih", "servet", "sinan", "şükrü", "tayfun", "temel", "timur", "tugay", "tuncay", "tuncer",
  "turhan", "umut", "ünal", "veli", "volkan", "yalçin", "yasar", "yilmaz", "zafer", "zeki",
  // Persian male names
  "milad", "arash", "arman", "arsalan", "babak", "bahram", "behnam", "behzad", "bijan", "cyrus",
  "dariush", "ehsan", "farhad", "farzad", "farzin", "hafez", "hamid", "hossein", "iman", "iraj",
  "javad", "kambiz", "kamran", "kaveh", "kayvan", "kourosh", "majid", "maziar", "mehdi", "mehran",
  "milad", "mojtaba", "morteza", "nader", "nima", "omid", "parham", "parviz", "payam", "pedram",
  "pouya", "ramin", "reza", "rostam", "saeed", "saman", "sepehr", "shahram", "shahin", "siamak",
  "sina", "soroush", "vahid", "yasin",
  // Arabic male names
  "abdelrahman", "adham", "ammar", "ashraf", "ayman", "basil", "basim", "fadi", "ghassan", "haitham",
  "hazim", "husam", "jaber", "jalal", "jamal", "jamil", "jawad", "kamal", "karam", "mazen",
  "moataz", "munir", "nael", "nasir", "nawaf", "nidal", "osama", "qais", "rabih", "rami",
  "raed", "saad", "safwan", "salman", "shaker", "sufyan", "tariq", "waleed", "wasim", "yasir",
  "ziad", "ziyad",
]);

// Names that are ambiguous across cultures (e.g. Andrea = male in DE, female in IT)
// These go to heuristic/unknown
const AMBIGUOUS_NAMES = new Set([
  "andrea", "dominique", "gabriele", "jean", "michele",
  "robin", "simone", "wei", "young", "yuki",
]);

// ── ALL_NAMES set for fast prefix matching ──
const ALL_NAMES = new Set([...FEMALE_NAMES, ...MALE_NAMES, ...AMBIGUOUS_NAMES]);

/**
 * Try to extract a known first name from an Instagram username.
 * Strategy:
 * 1. Split by `.`, `_`, `-` → test each part as a name
 * 2. If no split match: prefix-match (longest known name at start, min 4 chars)
 * First match wins (usernames typically have first name first).
 */
function extractGenderFromUsername(username: string): "male" | "female" | "unknown" {
  if (!username) return "unknown";

  const cleaned = username
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .trim();

  if (!cleaned || cleaned.length < 4) return "unknown";

  // Strategy 1: Split by delimiters and test each part
  const parts = cleaned.split(/[._\-]/);
  if (parts.length > 1) {
    for (const part of parts) {
      if (part.length < 4) continue;
      if (AMBIGUOUS_NAMES.has(part)) continue;
      if (FEMALE_NAMES.has(part)) return "female";
      if (MALE_NAMES.has(part)) return "male";
    }
  }

  // Strategy 2: Prefix-matching (longest match first, min 4 chars)
  // Try to find the longest known name at the start of the username
  const maxLen = Math.min(cleaned.length, 12);
  for (let len = maxLen; len >= 4; len--) {
    const prefix = cleaned.substring(0, len);
    if (ALL_NAMES.has(prefix)) {
      if (AMBIGUOUS_NAMES.has(prefix)) return "unknown";
      if (FEMALE_NAMES.has(prefix)) return "female";
      if (MALE_NAMES.has(prefix)) return "male";
    }
  }

  return "unknown";
}

/**
 * Detect gender from a full name string, with optional username fallback.
 * Returns "male", "female", or "unknown".
 *
 * Strategy:
 * 1. Clean display name (remove emojis, special chars)
 * 2. Extract first name from display name
 * 3. Check against name database
 * 4. Fallback: suffix heuristics on display name
 * 5. Fallback: extract name from Instagram username
 * 6. Fallback: "unknown"
 */
export function detectGender(fullName: string | null | undefined, username?: string | null): "male" | "female" | "unknown" {
  if (fullName && typeof fullName === "string") {
    const result = detectGenderFromName(fullName);
    if (result !== "unknown") return result;
  }

  // Fallback: try username
  if (username && typeof username === "string") {
    return extractGenderFromUsername(username);
  }

  return "unknown";
}

function detectGenderFromName(fullName: string): "male" | "female" | "unknown" {
  // Step 1: Clean the name
  const cleaned = fullName
    .normalize("NFKD")
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, "") // emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, "")   // symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, "")   // dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")   // variation selectors
    .replace(/[\u{200D}]/gu, "")             // zero width joiner
    .replace(/[\u0300-\u036f]/g, "")         // combining diacritical marks after NFKD
    .replace(/[^a-zA-Z\s-]/g, "")
    .trim()
    .toLowerCase();

  if (!cleaned || cleaned.length < 2) return "unknown";

  // Step 2: Extract first name (handle hyphenated names like "Anna-Marie")
  const parts = cleaned.split(/[\s]+/);
  const firstName = parts[0].split("-")[0]; // Take first part of hyphenated

  if (!firstName || firstName.length < 2) return "unknown";

  // Step 3: Check ambiguous names first
  if (AMBIGUOUS_NAMES.has(firstName)) return "unknown";

  // Step 4: Direct lookup in name database
  if (FEMALE_NAMES.has(firstName)) return "female";
  if (MALE_NAMES.has(firstName)) return "male";

  // Step 5: Try common nicknames / diminutives
  const nickname = resolveNickname(firstName);
  if (nickname) {
    if (FEMALE_NAMES.has(nickname)) return "female";
    if (MALE_NAMES.has(nickname)) return "male";
  }

  // Step 6: Suffix heuristics (less reliable, but catches many)
  const suffixResult = checkSuffix(firstName);
  if (suffixResult) return suffixResult;

  return "unknown";
}

function resolveNickname(name: string): string | null {
  const nicknames: Record<string, string> = {
    // German diminutives
    "leni": "lena", "anni": "anna", "hanni": "hannah", "steffi": "stefanie",
    "uschi": "ursula", "gabi": "gabriele", "kati": "katharina", "lisi": "elisabeth",
    "resi": "theresa", "vroni": "veronika", "michi": "michael", "hansi": "hans",
    "sepp": "josef", "wolfi": "wolfgang", "rudi": "rudolf", "fredi": "friedrich",
    "andi": "andreas", "flo": "florian", "basti": "bastian", "toni": "anton",
    // English diminutives
    "mike": "michael", "tom": "thomas", "bob": "robert", "bill": "william",
    "jim": "james", "joe": "joseph", "jake": "jacob", "nick": "nicholas",
    "chris": "christopher", "matt": "matthew", "dan": "daniel", "ben": "benjamin",
    "sam": "samuel", "alex": "alexander", "max": "maximilian", "leo": "leonard",
    "kate": "katherine", "beth": "elizabeth", "meg": "margaret", "sue": "susan",
    "jen": "jennifer", "liz": "elizabeth", "nat": "natalie", "vicky": "victoria",
    "becky": "rebecca", "abby": "abigail", "mandy": "amanda", "sandy": "sandra",
    "cindy": "cynthia", "patty": "patricia", "maggie": "margaret",
    // Turkish diminutives
    "gul": "gulsen", "nur": "nurgul", "naz": "nazli",
  };
  return nicknames[name] || null;
}

function checkSuffix(name: string): "male" | "female" | null {
  // Strong female indicators
  const femaleSuffixes = [
    "ina", "ine", "ette", "elle", "ella", "essa", "issa",
    "ovna", "evna", // Russian patronymics
    "ka", "ko",     // Slavic feminine (but not all -ko)
  ];
  
  // Moderate female indicators
  const femaleEndings = ["ia", "ya", "ie", "ee", "ey", "ly", "na", "da", "ta", "la"];
  
  // Strong male indicators  
  const maleSuffixes = [
    "ovich", "evich", // Russian patronymics
    "ius", "ius",     // Latin
    "sson", "sen",    // Scandinavian
  ];
  
  // Moderate male indicators
  const maleEndings = ["us", "os", "is", "er", "or", "an", "en", "on", "im", "am"];

  // Check strong indicators first
  for (const suffix of femaleSuffixes) {
    if (name.endsWith(suffix) && name.length > suffix.length + 1) return "female";
  }
  for (const suffix of maleSuffixes) {
    if (name.endsWith(suffix) && name.length > suffix.length + 1) return "male";
  }

  // Check moderate indicators (only for longer names to avoid false positives)
  if (name.length >= 4) {
    // -a ending: female in most European languages (but not Arabic/Turkish male names)
    if (name.endsWith("a") && !name.endsWith("ua") && !name.endsWith("pha")) {
      return "female";
    }
    
    for (const ending of femaleEndings) {
      if (name.endsWith(ending)) return "female";
    }
    for (const ending of maleEndings) {
      if (name.endsWith(ending)) return "male";
    }
  }

  return null;
}

/**
 * Batch detect gender for multiple names.
 * More efficient than calling detectGender() in a loop
 * because the Set lookups are already O(1).
 */
export function detectGenderBatch(names: Array<{ name: string; username?: string }>): Array<{ name: string; gender: "male" | "female" | "unknown" }> {
  return names.map(entry => ({
    name: entry.name,
    gender: detectGender(entry.name, entry.username),
  }));
}
