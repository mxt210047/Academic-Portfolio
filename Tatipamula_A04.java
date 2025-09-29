package Tatipamula_A02;
import java.util.Scanner;
import java.util.Random;
public class Tatipamula_A04 {

	public static void main(String[] args) {
		//Declare vars
		int ship1, guess, guesses = 0,sum = 0;
		int[]sea = new int[20];
		int[]hit = new int[20];
		
		
		//Create Scanner and Random objects
		Scanner input = new Scanner(System.in);
		Random random = new Random();
		
		//Create Welcome Message
		intro("");
		//Create for loop to create battleship
		ship1 = random.nextInt(20 - 3);
		sea[ship1] = 1;
		sea[ship1 + 1] = 1;
		sea[ship1 + 2] = 1;
		sea[ship1 + 3] = 1;
		prtSea(sea, "Sea");
		prtHit(hit, "Hit");
		
		
		while(sum<4) {
			guesses++;
			System.out.println();
			System.out.println("Enter an integer index value (0-19) to try to hit the battleship: ");
			guess = input.nextInt();
			if(guess >=0 && guess < sea.length) {
				
				if(sea[guess] == 1) {
					System.out.println("HIT!");
					hit[guess] = 1;
				}
				else {
					System.out.println("MISS!");
				}
				
			}
			else {
				System.out.println("Invalid index! Please enter a number between 0 and 19: ");
			}
			sum = 0;
			for(int i = 0; i < hit.length ; i++) {
				sum = sum+hit[i]; 
			}
			System.out.println();
		}
		System.out.println();
		System.out.println("SUNK!");
		prtSea(sea, "Sea");
		prtHit(hit,"Hit");
		System.out.println();
		System.out.println("Congratulations on sinking the battleship!");
		System.out.println("It took you " + guesses + " guesses.");

		
	}
	
public static void prtSea(int[] sea, String sea_) {
	System.out.print(sea_ + ": ");
	for(int i = 0; i < sea.length; i++) {
		System.out.print(sea[i] + " ");
	}
	System.out.println();
}
public static void prtHit(int[] hit, String hit_) {
	
	System.out.print(hit_ + ": ");
	for(int i = 0; i < hit.length; i++) {
		System.out.print(hit[i] + " ");
	}
	System.out.println();
}
public static void intro(String string) {
	//Create Welcome Message
		System.out.println("	   Welcome to the great game of MiniBattleship!");
		System.out.println("	Guess the location of the battleship until you have sunk it.");
		System.out.println();
}}
