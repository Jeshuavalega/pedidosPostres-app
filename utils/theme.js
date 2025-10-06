// utils/theme.js
export const colors = {
    background: '#fafafa',
    white: '#ffffff',
    primary: '#e91e63',
    primaryLight: '#f8bbd0',
    text: '#1c1c1e',
    textSecondary: '#6b6b6b',
    border: '#eee',
    inputBorder: '#ddd',
};

export const globalStyles = {
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
        paddingTop: 50,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'left',
    },
    subHeader: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 25,
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: colors.white,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
};
