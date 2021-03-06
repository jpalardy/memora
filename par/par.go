package par

import (
	"fmt"
	"io/ioutil"
	"os"
	"strings"
)

//-------------------------------------------------

func file2lines(filename string) ([]string, error) {
	bytes, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read par: %w", err)
	}
	content := string(bytes)
	return strings.Split(content, "\n"), nil
}

func Read(filename string) ([][]string, error) {
	lines, err := file2lines(filename)
	if err != nil {
		return nil, err
	}
	var result [][]string
	var paragraph []string
	push := func(line string) {
		if line == "" {
			if len(paragraph) > 0 {
				result = append(result, paragraph)
			}
			paragraph = nil
			return
		}
		paragraph = append(paragraph, line)
	}
	for _, line := range lines {
		push(line)
	}
	push("") // end-of-file flush
	return result, nil
}

func Write(filename string, paragraphs [][]string) error {
	f, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to write par: %w", err)
	}
	defer f.Close()
	for _, paragraph := range paragraphs {
		for _, line := range paragraph {
			fmt.Fprintln(f, line)
		}
		fmt.Fprintln(f, "")
	}
	return nil
}
