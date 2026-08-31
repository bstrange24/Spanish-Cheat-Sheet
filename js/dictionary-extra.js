// Additive practice entries only — never overwrite keys already in DICT.
(function () {
     if (typeof DICT === 'undefined') return;
     const extra = {
          // Family
          'la familia': { approx: 'lah fah-MEE-lyah', meaning: 'the family', level: 'beginner', cat: 'family' },
          padre: { approx: 'PAH-dreh', meaning: 'father', level: 'beginner', cat: 'family' },
          madre: { approx: 'MAH-dreh', meaning: 'mother', level: 'beginner', cat: 'family' },
          'los padres': { approx: 'lohs PAH-drehs', meaning: 'the parents', level: 'beginner', cat: 'family' },
          hermano: { approx: 'ehr-MAH-noh', meaning: 'brother', level: 'beginner', cat: 'family' },
          hermana: { approx: 'ehr-MAH-nah', meaning: 'sister', level: 'beginner', cat: 'family' },
          abuelo: { approx: 'ah-BWEH-loh', meaning: 'grandfather', level: 'beginner', cat: 'family' },
          abuela: { approx: 'ah-BWEH-lah', meaning: 'grandmother', level: 'beginner', cat: 'family' },
          tío: { approx: 'TEE-oh', meaning: 'uncle', level: 'beginner', cat: 'family' },
          tía: { approx: 'TEE-ah', meaning: 'aunt', level: 'beginner', cat: 'family' },
          primo: { approx: 'PREE-moh', meaning: 'cousin (m)', level: 'beginner', cat: 'family' },
          prima: { approx: 'PREE-mah', meaning: 'cousin (f)', level: 'beginner', cat: 'family' },
          esposo: { approx: 'ehs-POH-soh', meaning: 'husband', level: 'beginner', cat: 'family' },
          esposa: { approx: 'ehs-POH-sah', meaning: 'wife', level: 'beginner', cat: 'family' },
          hijo: { approx: 'EE-hoh', meaning: 'son', level: 'beginner', cat: 'family' },
          hija: { approx: 'EE-hah', meaning: 'daughter', level: 'beginner', cat: 'family' },
          // Body
          cabeza: { approx: 'kah-BEH-sah', meaning: 'head', level: 'beginner', cat: 'body' },
          ojo: { approx: 'OH-hoh', meaning: 'eye', level: 'beginner', cat: 'body' },
          mano: { approx: 'MAH-noh', meaning: 'hand', level: 'beginner', cat: 'body' },
          pie: { approx: 'pyeh', meaning: 'foot', level: 'beginner', cat: 'body' },
          brazo: { approx: 'BRAH-soh', meaning: 'arm', level: 'beginner', cat: 'body' },
          pierna: { approx: 'PYEHR-nah', meaning: 'leg', level: 'beginner', cat: 'body' },
          'me duele': { approx: 'meh DWEH-leh', meaning: 'it hurts (me)', level: 'intermediate', cat: 'body' },
          'estoy enfermo': { approx: 'ehs-TOY ehn-FEHR-moh', meaning: 'I am sick (m)', level: 'beginner', cat: 'body' },
          // House
          cocina: { approx: 'koh-SEE-nah', meaning: 'kitchen', level: 'beginner', cat: 'house' },
          baño: { approx: 'BAH-nyoh', meaning: 'bathroom', level: 'beginner', cat: 'house' },
          sala: { approx: 'SAH-lah', meaning: 'living room', level: 'beginner', cat: 'house' },
          cama: { approx: 'KAH-mah', meaning: 'bed', level: 'beginner', cat: 'house' },
          mesa: { approx: 'MEH-sah', meaning: 'table', level: 'beginner', cat: 'house' },
          silla: { approx: 'SEE-yah', meaning: 'chair', level: 'beginner', cat: 'house' },
          puerta: { approx: 'PWEHR-tah', meaning: 'door', level: 'beginner', cat: 'house' },
          ventana: { approx: 'behn-TAH-nah', meaning: 'window', level: 'beginner', cat: 'house' },
          llave: { approx: 'YAH-beh', meaning: 'key', level: 'beginner', cat: 'house' },
          // Weather
          'hace frío': { approx: 'AH-seh FREE-oh', meaning: "it's cold", level: 'beginner', cat: 'weather' },
          'hace calor': { approx: 'AH-seh kah-LOHR', meaning: "it's hot", level: 'beginner', cat: 'weather' },
          'hace sol': { approx: 'AH-seh sohl', meaning: "it's sunny", level: 'beginner', cat: 'weather' },
          'está nublado': { approx: 'ehs-TAH noo-BLAH-doh', meaning: "it's cloudy", level: 'beginner', cat: 'weather' },
          llueve: { approx: 'YWEH-beh', meaning: 'it is raining', level: 'beginner', cat: 'weather' },
          nieva: { approx: 'NYEH-bah', meaning: 'it is snowing', level: 'intermediate', cat: 'weather' },
          // Shopping
          tienda: { approx: 'TYEHN-dah', meaning: 'store', level: 'beginner', cat: 'shopping' },
          '¿cuánto cuesta?': { approx: 'KWAHN-toh KWEHS-tah', meaning: 'how much does it cost?', level: 'beginner', cat: 'shopping' },
          barato: { approx: 'bah-RAH-toh', meaning: 'cheap', level: 'beginner', cat: 'shopping' },
          caro: { approx: 'KAH-roh', meaning: 'expensive', level: 'beginner', cat: 'shopping' },
          efectivo: { approx: 'eh-fehk-TEE-boh', meaning: 'cash', level: 'intermediate', cat: 'shopping' },
          tarjeta: { approx: 'tar-HEH-tah', meaning: 'card', level: 'beginner', cat: 'shopping' },
          // Clothing
          ropa: { approx: 'ROH-pah', meaning: 'clothes', level: 'beginner', cat: 'clothing' },
          camisa: { approx: 'kah-MEE-sah', meaning: 'shirt', level: 'beginner', cat: 'clothing' },
          pantalones: { approx: 'pahn-tah-LOH-nehs', meaning: 'pants', level: 'beginner', cat: 'clothing' },
          zapatos: { approx: 'sah-PAH-tohs', meaning: 'shoes', level: 'beginner', cat: 'clothing' },
          abrigo: { approx: 'ah-BREE-goh', meaning: 'coat', level: 'beginner', cat: 'clothing' },
          'me pongo': { approx: 'meh POHN-goh', meaning: 'I put on', level: 'intermediate', cat: 'clothing' },
          // Animals
          perro: { approx: 'PEH-rroh', meaning: 'dog', level: 'beginner', cat: 'animals' },
          gato: { approx: 'GAH-toh', meaning: 'cat', level: 'beginner', cat: 'animals' },
          pájaro: { approx: 'PAH-hah-roh', meaning: 'bird', level: 'beginner', cat: 'animals' },
          vaca: { approx: 'BAH-kah', meaning: 'cow', level: 'beginner', cat: 'animals' },
          caballo: { approx: 'kah-BAH-yoh', meaning: 'horse', level: 'beginner', cat: 'animals' },
          mascota: { approx: 'mahs-KOH-tah', meaning: 'pet', level: 'beginner', cat: 'animals' },
          // Emotions
          'estoy feliz': { approx: 'ehs-TOY feh-LEES', meaning: 'I am happy', level: 'beginner', cat: 'emotions' },
          'tengo miedo': { approx: 'TEHN-goh MYEH-doh', meaning: 'I am afraid', level: 'beginner', cat: 'emotions' },
          'me siento bien': { approx: 'meh SYEHN-toh byehn', meaning: 'I feel good', level: 'beginner', cat: 'emotions' },
          'me siento mal': { approx: 'meh SYEHN-toh mahl', meaning: 'I feel bad', level: 'beginner', cat: 'emotions' },
          nervioso: { approx: 'nehr-BYOH-soh', meaning: 'nervous', level: 'intermediate', cat: 'emotions' },
          aburrido: { approx: 'ah-boo-RREE-doh', meaning: 'bored', level: 'intermediate', cat: 'emotions' },
          // Work & school
          escuela: { approx: 'ehs-KWEH-lah', meaning: 'school', level: 'beginner', cat: 'work' },
          tarea: { approx: 'tah-REH-ah', meaning: 'homework', level: 'beginner', cat: 'work' },
          examen: { approx: 'ehk-SAH-mehn', meaning: 'exam', level: 'beginner', cat: 'work' },
          oficina: { approx: 'oh-fee-SEE-nah', meaning: 'office', level: 'beginner', cat: 'work' },
          reunión: { approx: 'reh-oo-NYOHN', meaning: 'meeting', level: 'intermediate', cat: 'work' },
          'soy estudiante': { approx: 'soy ehs-too-DYAHN-teh', meaning: 'I am a student', level: 'beginner', cat: 'work' },
          // Numbers / time
          cero: { approx: 'SEH-roh', meaning: 'zero', level: 'beginner', cat: 'numbers' },
          '¿qué hora es?': { approx: 'keh OH-rah ehs', meaning: 'what time is it?', level: 'beginner', cat: 'time' },
          hoy: { approx: 'oy', meaning: 'today', level: 'beginner', cat: 'time' },
          mañana: { approx: 'mah-NYAH-nah', meaning: 'tomorrow / morning', level: 'beginner', cat: 'time' },
          ayer: { approx: 'ah-YEHR', meaning: 'yesterday', level: 'beginner', cat: 'time' },
          // Travel
          aeropuerto: { approx: 'ah-eh-roh-PWEHR-toh', meaning: 'airport', level: 'beginner', cat: 'travel' },
          vuelo: { approx: 'BWEH-loh', meaning: 'flight', level: 'beginner', cat: 'travel' },
          pasaporte: { approx: 'pah-sah-POHR-teh', meaning: 'passport', level: 'beginner', cat: 'travel' },
          maleta: { approx: 'mah-LEH-tah', meaning: 'suitcase', level: 'beginner', cat: 'travel' },
          hotel: { approx: 'oh-TEHL', meaning: 'hotel', level: 'beginner', cat: 'travel' },
          habitación: { approx: 'ah-bee-tah-SYOHN', meaning: 'room', level: 'beginner', cat: 'travel' },
          reserva: { approx: 'reh-SEHR-bah', meaning: 'reservation', level: 'intermediate', cat: 'travel' },
          'tengo una reserva': { approx: 'TEHN-goh OO-nah reh-SEHR-bah', meaning: 'I have a reservation', level: 'intermediate', cat: 'travel' },
          'quiero ir al centro': { approx: 'KYEH-roh eer ahl SEHN-troh', meaning: 'I want to go downtown', level: 'beginner', cat: 'travel' },
          // Grammar helpers
          puedo: { approx: 'PWEH-doh', meaning: 'I can', level: 'beginner', cat: 'verbs' },
          quiero: { approx: 'KYEH-roh', meaning: 'I want', level: 'beginner', cat: 'verbs' },
          digo: { approx: 'DEE-goh', meaning: 'I say', level: 'beginner', cat: 'verbs' },
          'te quiero': { approx: 'teh KYEH-roh', meaning: 'I love you', level: 'beginner', cat: 'emotions' },
          'me gusta': { approx: 'meh GOOS-tah', meaning: 'I like it', level: 'beginner', cat: 'everyday' },
     };
     Object.keys(extra).forEach(function (k) {
          if (!Object.prototype.hasOwnProperty.call(DICT, k)) {
               DICT[k] = extra[k];
          }
     });
})();
