M3D.RenderShaderFactory.parseShaderTokens = function (sourceCode, tokens) {

        var length = sourceCode.length;
        var words = [];
        var word = '', type;

        var before, beforeIsLetter;
        var char, ascii, charIsLetter, charIsNumber;
        var pushed, added, beforeIsNumber;

        //get ASCII char codes to compare
        var ASCII_a = 'a'.charCodeAt(0);
        var ASCII_z = 'z'.charCodeAt(0);
        var ASCII_A = 'A'.charCodeAt(0);
        var ASCII_Z = 'Z'.charCodeAt(0);
        var ASCII_0 = '0'.charCodeAt(0);
        var ASCII_9 = '9'.charCodeAt(0);

        var WORD = 0;
        var NUMBER = 1;
        var OPERATOR = 2;

        //load each string characters
        for (var i = 0; i < length; i++) {
            char = sourceCode[i];

            if (char === ' ') {
                charIsLetter = false;

                pushed = true;
                added = false;

            } else {

                //get ASCII code of character and compare witch criteria
                ascii = char.charCodeAt(0);
                charIsLetter = ascii >= ASCII_A && ascii <= ASCII_Z;
                charIsLetter |= ascii >= ASCII_a && ascii <= ASCII_z;
                charIsNumber = ascii >= ASCII_0 && ascii <= ASCII_9;

                if (before === ' ') {
                    ;

                } else if (charIsLetter) {
                    if (!beforeIsLetter && !beforeIsNumber)
                        pushed = true;

                } else if (charIsNumber) {
                    if (!beforeIsLetter && !beforeIsNumber)
                        pushed = true;

                } else if (char === '.') {
                    if (beforeIsLetter) {
                        pushed = true;

                    } else if (beforeIsNumber) {
                        if (type === NUMBER) {
                            charIsNumber = true;

                        } else {
                            pushed = true;

                        }

                    } else {
                        ;
                    }

                } else {
                    if (beforeIsLetter || beforeIsNumber)
                        pushed = true;

                }

                added = true;
            }

            if (pushed) {
                pushed = false;

                if (word.length > 0) {

                    //push word properties
                    words.push(word);
                    words.push(type);

                    //clear word
                    word = '';
                }

            }

            if (added) {
                added = false;

                //add char to work
                word += char;

                //define word type based on first character
                if (word.length === 1) {
                    if (charIsLetter)
                        type = WORD;
                    else if (charIsNumber)
                        type = NUMBER;
                    else
                        type = OPERATOR;
                }

            }

            //update before character properties
            before = char;
            beforeIsLetter = charIsLetter;
            beforeIsNumber = charIsNumber;

        }

        //save last word
        if (word.length > 0) {
            words.push(word);
            words.push(type);
        }

        tokens.words = words;

        return tokens;
    };

    
