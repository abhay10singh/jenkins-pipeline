function greet(name = 'Jenkins') {
    if (typeof name !== 'string' || name.trim() === '') {
        throw new TypeError('Name must be a non-empty string');
    }

    return `Hello, ${name}!`;
}

if (require.main === module) {
    console.log(greet(process.argv[2] || 'Jenkins'));
}

module.exports = { greet };
